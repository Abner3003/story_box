import 'dotenv/config'
import { Worker } from 'bullmq'
import { connection } from '@storybox/queues'
import { getBookById } from '../modules/admin/admin.repository.js'
import { getSubscriberById } from '../modules/payment/payment.repository.js'
import { getSignedAssetUrl, markBookDelivered } from '../modules/delivery/delivery.repository.js'
import { updateBookStatus } from '../modules/admin/admin.repository.js'
import { sendText, sendDocument, sendButtons } from '../lib/whatsapp.js'

interface DeliverBookJobData {
  bookId: string
  childId: string
  subscriberId: string
}

const worker = new Worker<DeliverBookJobData>(
  'book-delivery',
  async (job) => {
    const { bookId, subscriberId } = job.data

    const book = await getBookById(bookId)
    if (!book?.pdf_storage_path) {
      throw new Error(`Livro ${bookId} sem PDF gerado ainda`)
    }

    const subscriber = await getSubscriberById(subscriberId)
    const pdfUrl = await getSignedAssetUrl(book.pdf_storage_path)
    const title = book.title ?? 'Seu livro'

    await sendText(subscriber.phone, `📚 *${title}* está pronto! Aqui está a versão digital:`)
    await sendDocument(subscriber.phone, pdfUrl, `${title}.pdf`, title)

    await markBookDelivered(bookId)

    // Plano físico (qualquer plano que não seja o digital-only) — antes de
    // seguir pra impressão, confirma com a família que essa versão está
    // aprovada.
    if (subscriber.plan !== 'digital') {
      await sendButtons(subscriber.phone, 'Esse livro ficou aprovado pra impressão? 🖨️', [
        { id: 'print_approval_yes', title: 'Sim, aprovado!' },
        { id: 'print_approval_no', title: 'Não, quero ajustar' },
      ])
      await updateBookStatus(bookId, { status: 'awaiting_print_approval' })
    }

    console.log(`[delivery] livro ${bookId} entregue pro assinante ${subscriberId}`)
  },
  { connection },
)

worker.on('completed', (job) => {
  console.log(`[delivery] job ${job.id} concluído`)
})

worker.on('failed', (job, err) => {
  console.error(`[delivery] job ${job?.id} falhou:`, err)
})

console.log('Worker de entrega de livros (book-delivery) rodando...')
