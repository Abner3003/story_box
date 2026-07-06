import { Queue } from 'bullmq';
import { Redis as IORedis } from 'ioredis';
const connection = {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: Number(process.env.REDIS_PORT ?? 6379),
};
const redisClient = new IORedis({ ...connection, maxRetriesPerRequest: null });
// Lock distribuído (Redis) — ao contrário de um Map em memória, funciona
// igual independente de quantas réplicas da API estiverem rodando, porque
// todas conversam com o MESMO Redis. O TTL é uma rede de segurança: se o
// processo que detém o lock cair sem liberar, ele solta sozinho depois do
// TTL em vez de travar pra sempre.
const LOCK_TTL_MS = 60_000;
const POLL_INTERVAL_MS = 150;
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
export async function withLock(key, fn) {
    const lockKey = `lock:${key}`;
    while (true) {
        const acquired = await redisClient.set(lockKey, '1', 'PX', LOCK_TTL_MS, 'NX');
        if (acquired === 'OK')
            break;
        await sleep(POLL_INTERVAL_MS);
    }
    try {
        return await fn();
    }
    finally {
        await redisClient.del(lockKey);
    }
}
// Fila: mensagens inbound do WhatsApp → agente LangGraph
export const inboundQueue = new Queue('inbound-messages', { connection });
// Fila: geração do livro (texto + imagens + PDF)
export const generationQueue = new Queue('book-generation', { connection });
// Fila: entrega digital (WA) + disparo gráfica
export const deliveryQueue = new Queue('book-delivery', { connection });
// Fila: regeneração de página individual
export const regenQueue = new Queue('page-regen', { connection });
// Fila: crons mensais (disparo coleta dia 1, reminders)
export const schedulerQueue = new Queue('scheduler', { connection });
export { connection };
//# sourceMappingURL=index.js.map