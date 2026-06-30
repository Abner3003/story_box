import type { AbacatePayWebhookPayload } from './payment.models.js'
import { findSubscriberByAbacatePayId, updateSubscriberStatus } from './payment.repository.js'
import { resumeOnboarding, isOnboarding } from '../onboarding/onboarding.service.js'

export async function handleAbacatePayWebhook(payload: AbacatePayWebhookPayload): Promise<void> {
  const { event, data } = payload
  const customerId = data.billing.customer.id

  const subscriber = await findSubscriberByAbacatePayId(customerId)
  if (!subscriber) return

  switch (event) {
    case 'billing.paid': {
      await updateSubscriberStatus(subscriber.id, 'active')
      // Retoma o onboarding se o subscriber ainda está no flow (aguardando pagamento)
      const phone = data.billing.metadata?.phone
      if (phone && await isOnboarding(phone)) {
        await resumeOnboarding(phone, 'billing.paid')
      }
      break
    }
    case 'billing.expired':
    case 'billing.cancelled':
      await updateSubscriberStatus(subscriber.id, 'cancelled')
      break
    case 'billing.refunded':
      await updateSubscriberStatus(subscriber.id, 'paused')
      break
  }
}
