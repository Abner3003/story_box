import 'dotenv/config'
import { Worker } from 'bullmq'
import { connection } from '@storybox/queues'
import { buildIllustrationPrompt, buildCoverPrompt } from '@storybox/shared'
import {
  getCollectionForGeneration,
  findBookByCollectionId,
  createBook,
  updateBook,
  uploadBookAsset,
  StoragePaths,
} from '../modules/generation/generation.repository.js'
import { generateStory, calculateAge } from '../lib/story.js'
import { generateImage } from '../lib/illustration.js'
import { assembleBookPdf } from '../lib/pdf.js'
import { getSubscriberById } from '../modules/payment/payment.repository.js'

interface GenerateBookJobData {
  subscriberId: string
  childId: string
  collectionId: string
}

const DONE_STATUSES = new Set(['ready_for_review', 'approved', 'rejected', 'delivered_digital', 'sent_to_print', 'delivered_physical'])

const worker = new Worker<GenerateBookJobData>(
  'book-generation',
  async (job) => {
    const { childId, collectionId } = job.data

    const existingBook = await findBookByCollectionId(collectionId)
    if (existingBook && DONE_STATUSES.has(existingBook.status)) {
      console.log(`[generation] coleção ${collectionId} já concluída (livro ${existingBook.id}), pulando`)
      return
    }
    const book = existingBook ?? await createBook({ collection_id: collectionId, child_id: childId, status: 'generating_text' })

    const { collection, child } = await getCollectionForGeneration(collectionId)
    const visualProfile = child.visual_profile
    if (!visualProfile) {
      throw new Error(`Criança ${childId} sem visual_profile — foto ainda não foi processada`)
    }

    const styleId = visualProfile.chosen_style ?? 'watercolor'
    const childAge = calculateAge(child.birth_date)

    // A foto do momento é só referência visual (armazenada em
    // collection.photo_storage_path) — não entra na descrição da cena pro
    // texto/título, senão o que aparece no FUNDO da foto (ex: um elevador)
    // vira enredo, mesmo sem ter nada a ver com o momento que a família contou.
    const momentText = collection.moment_text ?? ''

    const subscriber = await getSubscriberById(job.data.subscriberId)
    const familyDescription = subscriber.family_description || undefined

    const story = await generateStory({
      childName: child.name,
      childAge,
      visualProfileRaw: visualProfile.raw_description,
      momentText,
      challengeText: collection.challenge_text ?? '',
      themePref: collection.theme_pref,
    })

    await updateBook(book.id, {
      title: story.title,
      moral: story.moral,
      story_json: story,
      status: 'generating_images',
      llm_model: 'gpt-4o',
    })

    // Sequencial, não Promise.all: a conta da OpenAI tem um limite baixo de
    // gerações de imagem por minuto (ex: 5/min) — disparar as 8 páginas de
    // uma vez estoura o limite e derruba o job com 429 no meio do livro.
    const pagesWithImages: Array<{ page: typeof story.pages[number] & { image_storage_path: string }; imageBuffer: Buffer }> = []
    for (const page of story.pages) {
      const prompt = buildIllustrationPrompt(page.illustration_prompt, child.name, visualProfile, styleId, familyDescription)
      const base64 = await generateImage(prompt)
      const path = await uploadBookAsset(StoragePaths.bookPage(book.id, page.page_number), base64, 'image/png')
      pagesWithImages.push({ page: { ...page, image_storage_path: path }, imageBuffer: Buffer.from(base64, 'base64') })
    }

    const coverPrompt = buildCoverPrompt(story.title, child.name, visualProfile, styleId, familyDescription)
    const coverBase64 = await generateImage(coverPrompt)
    const coverPath = await uploadBookAsset(StoragePaths.bookCover(book.id), coverBase64, 'image/png')
    const coverImageBuffer = Buffer.from(coverBase64, 'base64')

    await updateBook(book.id, {
      story_json: { ...story, pages: pagesWithImages.map((p) => p.page) },
      cover_image_storage_path: coverPath,
      status: 'assembling',
      image_model: 'gpt-image-1',
    })

    const pdfBuffer = await assembleBookPdf({
      title: story.title,
      coverImageBuffer,
      pages: pagesWithImages.map(({ page, imageBuffer }) => ({ page, imageBuffer })),
    })
    const pdfPath = await uploadBookAsset(StoragePaths.bookPdf(book.id), pdfBuffer, 'application/pdf')

    await updateBook(book.id, {
      pdf_storage_path: pdfPath,
      status: 'ready_for_review',
      generation_completed_at: new Date().toISOString(),
    })

    console.log(`[generation] livro ${book.id} pronto para curadoria (coleção ${collectionId})`)
  },
  { connection },
)

worker.on('completed', (job) => {
  console.log(`[generation] job ${job.id} concluído`)
})

worker.on('failed', (job, err) => {
  console.error(`[generation] job ${job?.id} falhou:`, err)
})

console.log('Worker de geração de livros (book-generation) rodando...')
