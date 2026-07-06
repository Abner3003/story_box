import 'dotenv/config'
import { Worker } from 'bullmq'
import { connection } from '@storybox/queues'
import { buildIllustrationPrompt } from '@storybox/shared'
import type { StoryJSON } from '@storybox/db'
import { getBookById } from '../modules/admin/admin.repository.js'
import { getCollectionForGeneration, updateBook, uploadBookAsset, StoragePaths } from '../modules/generation/generation.repository.js'
import { getSubscriberById } from '../modules/payment/payment.repository.js'
import { downloadChildPhoto } from '../modules/onboarding/onboarding.repository.js'
import { generateImage, type ReferenceImage } from '../lib/illustration.js'
import { assembleBookPdf } from '../lib/pdf.js'

interface RegenPageJobData {
  bookId: string
  pageNumber: number
  notes?: string
}

const worker = new Worker<RegenPageJobData>(
  'page-regen',
  async (job) => {
    const { bookId, pageNumber, notes } = job.data

    const book = await getBookById(bookId)
    if (!book) throw new Error(`Livro ${bookId} não encontrado`)

    const storyJson = book.story_json as StoryJSON | null
    if (!storyJson) throw new Error(`Livro ${bookId} sem história gerada ainda`)

    const targetPage = storyJson.pages.find((p) => p.page_number === pageNumber)
    if (!targetPage) throw new Error(`Página ${pageNumber} não existe no livro ${bookId}`)

    const { child } = await getCollectionForGeneration(book.collection_id)
    const visualProfile = child.visual_profile
    if (!visualProfile) throw new Error(`Criança ${child.id} sem visual_profile`)

    const subscriberId = book.monthly_collections?.subscriber_id
    const subscriber = subscriberId ? await getSubscriberById(subscriberId) : null
    const familyDescription = subscriber?.family_description || undefined
    const styleId = visualProfile.chosen_style ?? 'watercolor'

    const scenePrompt = notes
      ? `${targetPage.illustration_prompt} (ajuste solicitado pela curadoria: ${notes})`
      : targetPage.illustration_prompt

    const references: ReferenceImage[] = []
    if (child.photo_storage_path) references.push(await downloadChildPhoto(child.photo_storage_path))
    if (subscriber?.family_photo_path) references.push(await downloadChildPhoto(subscriber.family_photo_path))
    const referenceNote = references.length
      ? `\n\nReference photos attached — the first shows the real protagonist (${child.name}); it is essential (non-negotiable) that their skin tone, facial features and overall identity stay consistent with this reference, rendered in the ${styleId} style described above.${subscriber?.family_photo_path ? ' The next one shows real family members present in the scene — their skin tone and features must also be visibly consistent with this family (same likeness, adapted to the same illustration style), not generic or unrelated-looking people.' : ''}`
      : ''

    const prompt = buildIllustrationPrompt(scenePrompt, child.name, visualProfile, styleId, familyDescription) + referenceNote
    const base64 = await generateImage(prompt, references)
    const path = await uploadBookAsset(StoragePaths.bookPage(bookId, pageNumber), base64, 'image/png')

    const updatedPages = storyJson.pages.map((p) =>
      p.page_number === pageNumber ? { ...p, image_storage_path: path } : p,
    )

    await updateBook(bookId, { story_json: { ...storyJson, pages: updatedPages }, status: 'assembling' })

    // Reagrupa o PDF inteiro com a imagem nova — senão o PDF baixável fica
    // com a versão antiga dessa página mesmo depois de regerar.
    if (book.cover_image_storage_path && updatedPages.every((p) => p.image_storage_path)) {
      const coverImageBuffer = Buffer.from(
        (await downloadChildPhoto(book.cover_image_storage_path)).base64,
        'base64',
      )
      const pages = await Promise.all(
        updatedPages.map(async (p) => {
          const { base64: pageBase64 } = await downloadChildPhoto(p.image_storage_path!)
          return { page: p, imageBuffer: Buffer.from(pageBase64, 'base64') }
        }),
      )

      const pdfBuffer = await assembleBookPdf({ title: storyJson.title, coverImageBuffer, pages })
      const pdfPath = await uploadBookAsset(StoragePaths.bookPdf(bookId), pdfBuffer, 'application/pdf')
      await updateBook(bookId, { pdf_storage_path: pdfPath, status: 'ready_for_review' })
    } else {
      await updateBook(bookId, { status: 'ready_for_review' })
    }

    console.log(`[regen] página ${pageNumber} do livro ${bookId} regenerada`)
  },
  { connection, concurrency: 1 },
)

worker.on('completed', (job) => {
  console.log(`[regen] job ${job.id} concluído`)
})

worker.on('failed', (job, err) => {
  console.error(`[regen] job ${job?.id} falhou:`, err)
})

console.log('Worker de regeração de páginas (page-regen) rodando...')
