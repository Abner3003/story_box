const BASE_URL = 'https://graph.facebook.com/v20.0'

// ── Simulation interceptor ─────────────────────────────────
export type OutboundMessage =
  | { type: 'text';    to: string; body: string }
  | { type: 'video';   to: string; link: string; caption?: string }
  | { type: 'buttons'; to: string; body: string; buttons: Array<{ id: string; title: string }> }

type Interceptor = (msg: OutboundMessage) => void

let _interceptor: Interceptor | null = null

export function setInterceptor(fn: Interceptor | null) { _interceptor = fn }

// ── Internal helpers ───────────────────────────────────────
function phoneNumberId() {
  const id = process.env.WHATSAPP_PHONE_NUMBER_ID
  if (!id) throw new Error('WHATSAPP_PHONE_NUMBER_ID não configurado')
  return id
}

function accessToken() {
  const token = process.env.WHATSAPP_TOKEN ?? process.env.WHATSAPP_ACCESS_TOKEN
  if (!token) throw new Error('WHATSAPP_TOKEN não configurado')
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
