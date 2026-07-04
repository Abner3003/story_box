import 'dotenv/config'
import { Worker } from 'bullmq'
import { connection } from '@storybox/queues'
import { getBookById } from '../modules/admin/admin.repository.js'
import { getSubscriberById } from '../modules/payment/payment.repository.js'
import { getSignedPdfUrl, markBookDelivered } from '../modules/delivery/delivery.repository.js'
import { sendText, sendDocument } from '../lib/whatsapp.js'

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
    const pdfUrl = await getSignedPdfUrl(book.pdf_storage_path)
    const title = book.title ?? 'Seu livro'

    await sendText(subscriber.phone, `📚 *${title}* está pronto! Aqui está a versão digital:`)
    await sendDocument(subscriber.phone, pdfUrl, `${title}.pdf`, title)

    await markBookDelivered(bookId)

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
