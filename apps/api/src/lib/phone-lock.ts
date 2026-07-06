import { withLock } from '@storybox/queues'

// Serializa o processamento de mensagens por telefone. Como cada mensagem
// pode levar vários segundos (Vision + geração de imagem), se o usuário manda
// duas mensagens em sequência rápida, as duas chegam via webhook quase juntas
// e, sem isso, rodam concorrentemente no MESMO thread do LangGraph — cada
// uma resolvendo um interrupt diferente ao mesmo tempo e misturando as
// respostas. Isso garante que a segunda só começa depois que a primeira
// terminar de processar.
//
// Usa um lock no Redis (via @storybox/queues), não um Map em memória — um
// Map local só protege dentro de UM processo; com 2+ réplicas da API rodando,
// cada réplica teria seu próprio Map e o mutex deixaria de funcionar entre
// elas. O Redis já é infra compartilhada entre todas as réplicas (é o mesmo
// usado pelo BullMQ), então o lock vale de verdade pra qualquer uma delas.
export function runExclusive<T>(key: string, fn: () => Promise<T>): Promise<T> {
  return withLock(key, fn)
}
