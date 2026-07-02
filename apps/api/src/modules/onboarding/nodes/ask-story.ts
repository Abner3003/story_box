import { sendText } from '../../../lib/whatsapp.js'
import type { OnboardingState } from '../onboarding.state.js'

export async function askStoryNode(state: OnboardingState): Promise<Partial<OnboardingState>> {
  const name = state.children[state.featuredChildIndices[0]]?.name ?? 'seu filho'

  await sendText(
    state.phone,
    `💬 Agora me conta um *momento especial* de ${name} neste mês — pode ser algo engraçado, fofo ou marcante!\n\nExemplo: "Ela deu os primeiros passos e caiu rindo" 😄`,
  )

  return { storyQueueIndex: 0 }
}
