import 'dotenv/config'
import { Worker } from 'bullmq'
import { connection, schedulerQueue } from '@storybox/queues'
import { findSubscribersDueForWeeklyKickoff, markWeeklyKickoffSent } from '../modules/onboarding/onboarding.repository.js'
import { startWeeklyCollection } from '../modules/onboarding/weekly-collection.service.js'

const WEEKLY_KICKOFF_JOB = 'weekly-kickoff-check'

await schedulerQueue.add(WEEKLY_KICKOFF_JOB, {}, {
  repeat: { pattern: '0 9 * * *' },
  jobId: WEEKLY_KICKOFF_JOB,
})

const worker = new Worker(
  'scheduler',
  async (job) => {
    if (job.name !== WEEKLY_KICKOFF_JOB) return

    const subscribers = await findSubscribersDueForWeeklyKickoff()
    console.log(`[scheduler] ${subscribers.length} assinante(s) devido(s) para o convite semanal`)

    for (const subscriber of subscribers) {
      try {
        await startWeeklyCollection(subscriber)
        await markWeeklyKickoffSent(subscriber.id)
      } catch (err) {
        console.error(`[scheduler] falha ao iniciar coleta semanal para ${subscriber.id}:`, err)
      }
    }
  },
  { connection },
)

worker.on('completed', (job) => {
  console.log(`[scheduler] job ${job.id} concluído`)
})

worker.on('failed', (job, err) => {
  console.error(`[scheduler] job ${job?.id} falhou:`, err)
})

console.log('Worker de agendamento (scheduler) rodando...')
