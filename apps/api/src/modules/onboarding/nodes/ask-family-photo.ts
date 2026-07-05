import { sendText } from '../../../lib/whatsapp.js'
import type { OnboardingState } from '../onboarding.state.js'

export async function askFamilyPhotoNode(state: OnboardingState): Promise<Partial<OnboardingState>> {
  await sendText(
    state.phone,
    '📸 Mais uma coisa: você pode me mandar uma foto da família toda (você, seu parceiro(a), outros filhos)? Vou usar pra deixar as ilustrações com a carinha de todo mundo, sempre que a família aparecer na história!\n\nSe preferir não mandar, é só digitar *não*.',
  )
  return {}
}
