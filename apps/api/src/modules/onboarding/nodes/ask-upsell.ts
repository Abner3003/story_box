import { sendText } from '../../../lib/whatsapp.js'
import type { OnboardingState } from '../onboarding.state.js'

export async function askUpsellNode(state: OnboardingState): Promise<Partial<OnboardingState>> {
  await sendText(
    state.phone,
    `🎉 Que bom que ${state.subscriberName ? `${state.subscriberName} ` : ''}aproveitou o livro! Que tal conhecer nossos planos de assinatura? Toda semana um livro novo e personalizado, só pra vocês. 📚✨`,
  )
  return {}
}
