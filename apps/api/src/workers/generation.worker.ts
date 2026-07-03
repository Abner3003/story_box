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
import { describeMomentScene } from '../lib/vision.js'
import { downloadChildPhoto } from '../modules/onboarding/onboarding.repository.js'

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

    let momentText = collection.moment_text ?? ''
    if (collection.photo_storage_path) {
      try {
        const { base64, mimeType } = await downloadChildPhoto(collection.photo_storage_path)
        const sceneDescription = await describeMomentScene(base64, mimeType)
        if (sceneDescription) momentText = `${momentText}\n\nCena da foto enviada: ${sceneDescription}`
      } catch (err) {
        console.error(`[generation] falha ao descrever a foto do momento (coleção ${collectionId}):`, err)
      }
    }

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

    const pagesWithImages = await Promise.all(
      story.pages.map(async (page) => {
        const prompt = buildIllustrationPrompt(page.illustration_prompt, child.name, visualProfile, styleId)
        const base64 = await generateImage(prompt)
        const path = await uploadBookAsset(StoragePaths.bookPage(book.id, page.page_number), base64, 'image/png')
        return { page: { ...page, image_storage_path: path }, imageBuffer: Buffer.from(base64, 'base64') }
      }),
    )

    const coverPrompt = buildCoverPrompt(story.title, child.name, visualProfile, styleId)
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
