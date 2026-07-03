export type AbacatePayEventType =
  | 'checkout.completed'
  | 'checkout.refunded'
  | 'checkout.disputed'
  | 'checkout.lost'
  | 'transparent.completed'
  | 'transparent.refunded'
  | 'transparent.disputed'
  | 'transparent.lost'
  | 'subscription.completed'
  | 'subscription.trial_started'
  | 'subscription.cancelled'
  | 'subscription.renewed'
  | 'payout.completed'
  | 'payout.failed'
  | 'transfer.completed'
  | 'transfer.failed'

// Formato exato do `data` ainda não confirmado com a documentação real —
// mantido solto de propósito pra não rejeitar eventos por causa de um campo
// que a gente errou o nome. payment.service.ts extrai os campos de forma
// defensiva, tentando os formatos mais prováveis.
export interface AbacatePayWebhookPayload {
  id?: string
  event: AbacatePayEventType
  apiVersion?: number
  devMode?: boolean
  data: Record<string, unknown>
}
