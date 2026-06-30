export type AbacatePayEventType =
  | 'billing.paid'
  | 'billing.expired'
  | 'billing.cancelled'
  | 'billing.refunded'

export interface AbacatePayWebhookPayload {
  event: AbacatePayEventType
  data: {
    billing: {
      id: string
      customer: { id: string }
      amount: number
      status: string
      metadata?: Record<string, string>
    }
  }
}
