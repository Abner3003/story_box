import type { AbacatePayWebhookPayload } from './payment.models.js'
import {
  findSubscriberByAbacatePayId,
  findSubscriberByPhone,
  updateSubscriberBilling,
  updateSubscriberStatus,
} from './payment.repository.js'
import { resumeOnboarding, isOnboarding } from '../onboarding/onboarding.service.js'

const PAID_EVENTS = new Set(['checkout.completed', 'transparent.completed', 'subscription.completed', 'subscription.renewed'])
const CANCELLED_EVENTS = new Set(['subscription.cancelled', 'checkout.disputed', 'checkout.lost', 'transparent.disputed', 'transparent.lost'])
const REFUNDED_EVENTS = new Set(['checkout.refunded', 'transparent.refunded'])

type Loose = Record<string, any>

// Formato exato do `data` por evento ainda não confirmado 1:1 com a
// documentação — a AbacatePay pode aninhar em data.checkout/data.subscription
// dependendo do evento. Tentamos os caminhos mais prováveis em vez de travar
// num único formato, pra não descartar o evento por causa de um campo com
// nome diferente do esperado.
function extractBillingInfo(data: Loose): { customerId?: string; phone?: string } {
  const entity: Loose = data.checkout ?? data.subscription ?? data
  const customerId = entity?.customer?.id ?? entity?.customerId ?? data.customer?.id ?? data.customerId
  const phone = entity?.metadata?.phone ?? data.metadata?.phone ?? entity?.customer?.metadata?.phone

  return { customerId, phone }
}

export async function handleAbacatePayWebhook(payload: AbacatePayWebhookPayload): Promise<void> {
  const { event, data } = payload
  const { customerId, phone } = extractBillingInfo(data as Loose)

  console.log(`[abacatepay] webhook recebido: event=${event} customerId=${customerId} phone=${phone}`)
  console.log(`[abacatepay] payload completo: ${JSON.stringify(payload)}`)

  const subscriber =
    (phone ? await findSubscriberByPhone(phone) : null) ??
    (customerId ? await findSubscriberByAbacatePayId(customerId) : null)

  if (!subscriber) {
    console.log(`[abacatepay] nenhum assinante encontrado pra phone=${phone} customerId=${customerId}`)
    return
  }

  if (PAID_EVENTS.has(event)) {
    await updateSubscriberBilling(subscriber.id, {
      status: 'active',
      ...(customerId ? { abacatepayCustomerId: customerId } : {}),
    })

    if (phone && (await isOnboarding(phone))) {
      await resumeOnboarding(phone, 'billing.paid')
      console.log(`[abacatepay] onboarding retomado automaticamente pra ${phone}`)
    } else {
      console.log(`[abacatepay] assinante ${subscriber.id} marcado como active (evento ${event}), sem onboarding pendente pra retomar`)
    }
    return
  }

  if (CANCELLED_EVENTS.has(event)) {
    await updateSubscriberStatus(subscriber.id, 'cancelled')
    return
  }

  if (REFUNDED_EVENTS.has(event)) {
    await updateSubscriberStatus(subscriber.id, 'paused')
    return
  }

  console.log(`[abacatepay] evento ${event} recebido mas não tratado`)
}
