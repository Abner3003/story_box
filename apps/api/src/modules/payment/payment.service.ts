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

  console.log(`[abacatepay] webhook recebido: event=${event} customerId=${customerId} phone=${phone}`)

  const subscriber =
    (phone ? await findSubscriberByPhone(phone) : null) ??
    await findSubscriberByAbacatePayId(customerId)

  if (!subscriber) {
    console.log(`[abacatepay] nenhum assinante encontrado pra phone=${phone} customerId=${customerId}`)
    return
  }

  switch (event) {
    case 'billing.paid': {
      await updateSubscriberBilling(subscriber.id, {
        status: 'active',
        abacatepayCustomerId: customerId,
      })

      if (phone && (await isOnboarding(phone))) {
        await resumeOnboarding(phone, 'billing.paid')
        console.log(`[abacatepay] onboarding retomado automaticamente pra ${phone}`)
      } else {
        console.log(`[abacatepay] assinante ${subscriber.id} marcado como active, mas não estava em onboarding (sem graph pra retomar)`)
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
