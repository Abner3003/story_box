import { interrupt } from '@langchain/langgraph'
import { sendText } from '../../../lib/whatsapp.js'
import { createSubscriber } from '../onboarding.repository.js'
import type { OnboardingState } from '../onboarding.state.js'

// TODO: integrar AbacatePay para gerar link real
// Passar metadata: { phone } para que o webhook billing.paid saiba qual thread retomar
async function createPaymentLink(plan: string, phone: string): Promise<string> {
  void plan; void phone
  return 'https://abacatepay.com/pay/placeholder'
}

async function saveSubscriber(state: OnboardingState): Promise<string> {
  return createSubscriber({
    phone:     state.phone,
    plan:      state.plan!,
    full_name: state.subscriberName || state.phone,
  })
}

export async function paymentNode(state: OnboardingState): Promise<Partial<OnboardingState>> {
  if (state.simulate) {
    await sendText(state.phone, '✅ [Simulação] Pagamento confirmado automaticamente!')
    const subscriberId = await saveSubscriber(state)
    return { subscriberId }
  }

  const link = await createPaymentLink(state.plan!, state.phone)

  await sendText(
    state.phone,
    `Ótima escolha! 🎉\n\nClique no link para concluir o pagamento:\n${link}\n\nAssim que o pagamento for confirmado eu te aviso aqui! ✅`,
  )

  // Desbloqueia via:
  // 1. Webhook AbacatePay billing.paid → resumeOnboarding(phone, 'billing.paid')
  // 2. Usuário manda "paguei" manualmente (fallback)
  while (true) {
    const msg = interrupt<string>('awaiting_payment_confirmation')

    if (msg === 'billing.paid') {
      await sendText(state.phone, '🎉 Pagamento confirmado! Vamos continuar o seu cadastro.')
      const subscriberId = await saveSubscriber(state)
      return { subscriberId }
    }

    const lower = msg.toLowerCase()
    if (lower.includes('paguei') || lower.includes('pago') || lower.includes('ok')) {
      await sendText(state.phone, '🔍 Verificando seu pagamento...')
      // TODO: consultar status real no AbacatePay antes de prosseguir
      const subscriberId = await saveSubscriber(state)
      return { subscriberId }
    }

    await sendText(state.phone, `Ainda não recebi a confirmação. Tente o link novamente:\n${link}`)
  }
}
