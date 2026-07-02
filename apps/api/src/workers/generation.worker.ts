import 'dotenv/config'
import { Worker } from 'bullmq'
import { connection } from '@storybox/queues'

interface GenerateBookJobData {
  subscriberId: string
  childId: string
  collectionId: string
}

const worker = new Worker<GenerateBookJobData>(
  'book-generation',
  async (job) => {
    const { subscriberId, childId, collectionId } = job.data
    // TODO: gerar texto (OpenAI) + imagens, montar PDF, salvar em `books` e
    // enfileirar em deliveryQueue quando pronto.
    console.log(`[generation] processando subscriber=${subscriberId} child=${childId} collection=${collectionId}`)
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
