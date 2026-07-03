// Serializa o processamento de mensagens por telefone. Como cada mensagem
// pode levar vários segundos (Vision + geração de imagem), se o usuário manda
// duas mensagens em sequência rápida, as duas chegam via webhook quase juntas
// e, sem isso, rodam concorrentemente no MESMO thread do LangGraph — cada
// uma resolvendo um interrupt diferente ao mesmo tempo e misturando as
// respostas. Isso garante que a segunda só começa depois que a primeira
// terminar de processar.
const queues = new Map<string, Promise<unknown>>()

export function runExclusive<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const prior = queues.get(key) ?? Promise.resolve()
  const next = prior.then(fn, fn)
  queues.set(key, next.catch(() => {}))
  return next
}
