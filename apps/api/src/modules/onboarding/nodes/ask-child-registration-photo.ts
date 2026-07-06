import { sendText } from '../../../lib/whatsapp.js'
import type { OnboardingState } from '../onboarding.state.js'

export async function askChildRegistrationPhotoNode(state: OnboardingState): Promise<Partial<OnboardingState>> {
  const name = state.children[state.children.length - 1]?.name ?? 'seu filho'

  await sendText(
    state.phone,
    `📸 Agora me manda uma foto recente de *${name}*? Isso ajuda a gente a reconhecer ele(a) em fotos de família e deixar as ilustrações mais parecidas.\n\nSe preferir, digite *não* pra pular.`,
  )

  return {}
}
