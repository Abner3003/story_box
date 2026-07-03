import { sendText } from '../../../lib/whatsapp.js'
import { createCheckout } from '../../billing/billing.service.js'
import { updateSubscriberBilling } from '../../payment/payment.repository.js'
import { markSubscriberActiveByPhone } from '../onboarding.repository.js'
import type { OnboardingState } from '../onboarding.state.js'

async function createPaymentLink(
  planId: string,
  isRecurring: boolean,
  phone: string,
  name: string,
  email?: string,
  cpf?: string,
): Promise<{ url: string; customerId: string | null }> {
  const checkout = await createCheckout({
    planId,
    isRecurring,
    customer: {
      name,
      email,
      phone,
      taxId: cpf,
    },
  })

  return { url: checkout.checkout_url, customerId: checkout.customerId }
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

  const { url, customerId } = await createPaymentLink(
    state.abacatepayPlanId,
    state.planIsRecurring,
    state.phone,
    state.subscriberName || state.phone,
    state.subscriberEmail,
    state.subscriberCpf,
  )

  if (customerId && state.subscriberId) {
    await updateSubscriberBilling(state.subscriberId, { abacatepayCustomerId: customerId })
  }

  await sendText(
    state.phone,
    `${state.subscriberName}, seu plano foi selecionado 🚀\nFinalize aqui:\n${url}\n\nAssim que o pagamento for confirmado eu te aviso por aqui.`,
  )

  return { paymentLink: url, paymentConfirmed: false }
}
