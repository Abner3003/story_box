import { interrupt } from '@langchain/langgraph'
import { sendText } from '../../../lib/whatsapp.js'
import { checkEditIntent } from '../edit-intent.js'
import type { OnboardingState } from '../onboarding.state.js'

export async function collectMomentNode(state: OnboardingState): Promise<Partial<OnboardingState>> {
  const moment = interrupt<string>('awaiting_moment')

  const edit = await checkEditIntent(moment, 'collect_moment')
  if (edit) return edit

  const name = state.children[state.featuredChildIndices[state.storyQueueIndex]]?.name ?? 'seu filho'

  await sendText(
    state.phone,
    `Adorei! 💛\n\nTem algum *desafio ou aprendizado* que ${name} está passando? Isso enriquece a história!\n\nExemplo: "Está aprendendo a comer sozinha"`,
  )

  return { storyMoment: moment, editIntent: undefined }
}
