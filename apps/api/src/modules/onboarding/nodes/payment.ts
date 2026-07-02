import { sendText } from '../../../lib/whatsapp.js'
import { createCheckout } from '../../billing/billing.service.js'
import { markSubscriberActiveByPhone } from '../onboarding.repository.js'
import type { OnboardingState } from '../onboarding.state.js'

async function createPaymentLink(planId: string, phone: string, name: string, email?: string): Promise<string> {
  const checkout = await createCheckout({
    planId,
    customer: {
      name,
      email,
      phone,
    },
  })

  return checkout.checkout_url
}

export async function paymentNode(state: OnboardingState): Promise<Partial<OnboardingState>> {
  if (!state.abacatepayPlanId) {
    throw new Error('Plano da AbacatePay nao definido no estado do onboarding')
  }

  if (state.simulate) {
    await sendText(state.phone, '✅ [Simulação] Pagamento confirmado automaticamente!')
    const subscriberId = await markSubscriberActiveByPhone(state.phone)
    return { subscriberId: subscriberId ?? state.subscriberId, paymentConfirmed: true, returnTo: undefined }
  }

  const link = await createPaymentLink(
    state.abacatepayPlanId,
    state.phone,
    state.subscriberName || state.phone,
  )

  await sendText(
    state.phone,
    `Seu plano foi selecionado 🚀\nFinalize aqui:\n${link}\n\nAssim que o pagamento for confirmado eu te aviso por aqui.`,
  )

  return { paymentLink: link, paymentConfirmed: false }
}
