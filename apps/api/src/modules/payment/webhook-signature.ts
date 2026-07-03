import { createHmac, timingSafeEqual } from 'node:crypto'

// A AbacatePay assina cada webhook com HMAC-SHA256 (base64) no header
// X-Webhook-Signature, usando o `secret` definido na criação do webhook —
// ainda não confirmado 1:1 contra uma entrega real, por isso o cálculo fica
// exposto separadamente pra permitir log de diagnóstico no router.
export function computeWebhookSignature(rawBody: string, secret: string): string {
  return createHmac('sha256', secret).update(rawBody).digest('base64')
}

export function isValidWebhookSignature(rawBody: string, signature: string | undefined, secret: string): boolean {
  if (!signature) return false

  const expected = Buffer.from(computeWebhookSignature(rawBody, secret))
  const actual = Buffer.from(signature)

  if (expected.length !== actual.length) return false
  return timingSafeEqual(expected, actual)
}
