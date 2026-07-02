import { sendText } from '../../../lib/whatsapp.js'
import { featuredChildNames, formatChildNameList } from '../featured-children.js'
import type { OnboardingState } from '../onboarding.state.js'

export async function askStoryNode(state: OnboardingState): Promise<Partial<OnboardingState>> {
  const names = formatChildNameList(featuredChildNames(state))

  await sendText(
    state.phone,
    `💬 Agora me conta um *momento especial* de ${names} neste mês — pode ser algo engraçado, fofo ou marcante!\n\nExemplo: "Ela deu os primeiros passos e caiu rindo" 😄`,
  )

  return {}
}
