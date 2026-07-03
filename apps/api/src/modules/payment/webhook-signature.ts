import { createHmac, timingSafeEqual } from 'node:crypto'

// A AbacatePay assina cada webhook com HMAC-SHA256 (base64) no header
// X-Webhook-Signature, usando o `secret` definido na criação do webhook.
export function isValidWebhookSignature(rawBody: string, signature: string | undefined, secret: string): boolean {
  if (!signature) return false

  const expected = Buffer.from(createHmac('sha256', secret).update(rawBody).digest('base64'))
  const actual = Buffer.from(signature)

  if (expected.length !== actual.length) return false
  return timingSafeEqual(expected, actual)
}
