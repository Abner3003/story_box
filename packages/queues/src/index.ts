import { Queue } from 'bullmq'

const connection = {
  host: process.env.REDIS_HOST ?? 'localhost',
  port: Number(process.env.REDIS_PORT ?? 6379),
}

// Fila: mensagens inbound do WhatsApp → agente LangGraph
export const inboundQueue = new Queue('inbound-messages', { connection })

// Fila: geração do livro (texto + imagens + PDF)
export const generationQueue = new Queue('book-generation', { connection })

// Fila: entrega digital (WA) + disparo gráfica
export const deliveryQueue = new Queue('book-delivery', { connection })

// Fila: regeneração de página individual
export const regenQueue = new Queue('page-regen', { connection })

// Fila: crons mensais (disparo coleta dia 1, reminders)
export const schedulerQueue = new Queue('scheduler', { connection })

export { connection }
