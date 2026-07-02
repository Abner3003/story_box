import type { AbacatePayWebhookPayload } from './payment.models.js'
import {
  findSubscriberByAbacatePayId,
  findSubscriberByPhone,
  updateSubscriberBilling,
  updateSubscriberStatus,
} from './payment.repository.js'
import { resumeOnboarding, isOnboarding } from '../onboarding/onboarding.service.js'

export async function handleAbacatePayWebhook(payload: AbacatePayWebhookPayload): Promise<void> {
  const { event, data } = payload
  const customerId = data.billing.customer.id
  const phone = data.billing.metadata?.phone

  const subscriber =
    (phone ? await findSubscriberByPhone(phone) : null) ??
    await findSubscriberByAbacatePayId(customerId)

  if (!subscriber) return

  switch (event) {
    case 'billing.paid': {
      await updateSubscriberBilling(subscriber.id, {
        status: 'active',
        abacatepayCustomerId: customerId,
      })

      if (phone && (await isOnboarding(phone))) {
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
