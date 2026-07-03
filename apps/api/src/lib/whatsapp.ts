function envValue(...keys: Array<string | undefined>): string | undefined {
  for (const key of keys) {
    if (!key) continue
    const value = process.env[key]
    if (value) return value
  }
  return undefined
}

const META_API_VERSION = process.env.META_API_VERSION ?? 'v20.0'
const BASE_URL = `https://graph.facebook.com/${META_API_VERSION}`

// ── Simulation interceptor ─────────────────────────────────
export type OutboundMessage =
  | { type: 'text';    to: string; body: string }
  | { type: 'video';   to: string; link: string; caption?: string }
  | { type: 'image';   to: string; link: string; caption?: string }
  | { type: 'buttons'; to: string; body: string; buttons: Array<{ id: string; title: string }> }
  | { type: 'template'; to: string; name: string; languageCode: string; components?: unknown[] }

type Interceptor = (msg: OutboundMessage) => void

let _interceptor: Interceptor | null = null

export function setInterceptor(fn: Interceptor | null) { _interceptor = fn }

// ── Internal helpers ───────────────────────────────────────
function phoneNumberId() {
  const id = envValue('META_PHONE_NUMBER_ID', 'WHATSAPP_PHONE_NUMBER_ID')
  if (!id) throw new Error('META_PHONE_NUMBER_ID/WHATSAPP_PHONE_NUMBER_ID não configurado')
  return id
}

function accessToken() {
  const token = envValue('META_ACCESS_TOKEN', 'WHATSAPP_TOKEN', 'WHATSAPP_ACCESS_TOKEN')
  if (!token) throw new Error('META_ACCESS_TOKEN/WHATSAPP_ACCESS_TOKEN não configurado')
  return token
}

async function post(body: Record<string, unknown>): Promise<void> {
  const res = await fetch(`${BASE_URL}/${phoneNumberId()}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken()}`,
    },
    body: JSON.stringify({ messaging_product: 'whatsapp', ...body }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`WhatsApp API error ${res.status}: ${err}`)
  }
}

// ── Media download ─────────────────────────────────────────
export async function downloadMedia(mediaId: string): Promise<{ base64: string; mimeType: string }> {
  const token = accessToken()

  // 1. Resolve URL da mídia
  const metaRes = await fetch(`${BASE_URL}/${mediaId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!metaRes.ok) throw new Error(`WhatsApp media meta error ${metaRes.status}`)
  const { url, mime_type } = await metaRes.json() as { url: string; mime_type: string }

  // 2. Baixa o binário
  const fileRes = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!fileRes.ok) throw new Error(`WhatsApp media download error ${fileRes.status}`)
  const buffer = await fileRes.arrayBuffer()

  return {
    base64: Buffer.from(buffer).toString('base64'),
    mimeType: mime_type,
  }
}

// ── Public API ─────────────────────────────────────────────
export async function sendText(to: string, body: string): Promise<void> {
  if (_interceptor) { _interceptor({ type: 'text', to, body }); return }
  await post({ to, type: 'text', text: { body } })
}

export async function sendVideo(to: string, link: string, caption?: string): Promise<void> {
  if (_interceptor) { _interceptor({ type: 'video', to, link, caption }); return }
  await post({ to, type: 'video', video: { link, caption } })
}

export async function sendImage(to: string, link: string, caption?: string): Promise<void> {
  if (_interceptor) { _interceptor({ type: 'image', to, link, caption }); return }
  await post({ to, type: 'image', image: { link, caption } })
}

// Marca a mensagem recebida como lida e mostra "digitando..." até a próxima
// resposta ser enviada (ou 25s, o que vier primeiro). Não existe no fluxo de simulação.
export async function showTypingIndicator(incomingMessageId: string): Promise<void> {
  if (_interceptor) return
  await post({
    status: 'read',
    message_id: incomingMessageId,
    typing_indicator: { type: 'text' },
  })
}

// Mensagem pró-ativa fora da janela de 24h — exige um Message Template já
// aprovado pela Meta no WhatsApp Manager (não dá pra criar/aprovar por código).
export async function sendTemplate(
  to: string,
  name: string,
  languageCode = 'pt_BR',
  components?: unknown[],
): Promise<void> {
  if (_interceptor) { _interceptor({ type: 'template', to, name, languageCode, components }); return }
  await post({
    to,
    type: 'template',
    template: {
      name,
      language: { code: languageCode },
      ...(components ? { components } : {}),
    },
  })
}

export async function sendButtons(
  to: string,
  body: string,
  buttons: Array<{ id: string; title: string }>,
): Promise<void> {
  if (_interceptor) { _interceptor({ type: 'buttons', to, body, buttons }); return }
  await post({
    to,
    type: 'interactive',
    interactive: {
      type: 'button',
      body: { text: body },
      action: {
        buttons: buttons.map((b) => ({ type: 'reply', reply: b })),
      },
    },
  })
}
