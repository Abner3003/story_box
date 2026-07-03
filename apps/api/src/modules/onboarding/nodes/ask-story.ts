import { sendText } from '../../../lib/whatsapp.js'
import type { OnboardingState } from '../onboarding.state.js'

export async function askStoryNode(state: OnboardingState): Promise<Partial<OnboardingState>> {
  const name = state.children[state.featuredChildIndices[0]]?.name ?? 'seu filho'

  await sendText(
    state.phone,
    `📸 Antes de tudo: você tem alguma *foto* de um momento especial de ${name} neste mês? Se tiver, me manda que vou usar pra deixar a ilustração mais especial!\n\nSe não tiver, é só digitar *não*.`,
  )

  return { storyQueueIndex: 0 }
}
