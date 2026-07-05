import { sendText } from '../../../lib/whatsapp.js'
import type { OnboardingState } from '../onboarding.state.js'

export async function sendHelpNode(state: OnboardingState): Promise<Partial<OnboardingState>> {
  await sendText(
    state.phone,
    'Pode me contar aqui mesmo o que você precisa — nossa equipe vai te responder por aqui 💛',
  )
  return {}
}
