// webhook.service.ts representa mensagens não-texto como "[image:id]",
// "[video]", "[audio]" etc. Se isso chegar num nó que espera uma ESCOLHA
// (estilo, plano, tipo de compra), é quase sempre uma foto/mídia atrasada de
// uma etapa anterior — reentrega da Meta com um message_id diferente, então
// o dedup por id não pega. Melhor ignorar em silêncio do que responder
// "opção inválida" pra algo que o usuário nem digitou.
const MEDIA_TAG_RE = /^\[(image|video|audio|document|interactive|unsupported)(:.*)?\]$/i

export function looksLikeStrayMediaMessage(text: string): boolean {
  return MEDIA_TAG_RE.test(text.trim())
}
