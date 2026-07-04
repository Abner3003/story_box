import { interrupt } from '@langchain/langgraph'
import { sendText } from '../../../lib/whatsapp.js'
import { checkEditIntent } from '../edit-intent.js'
import type { OnboardingState } from '../onboarding.state.js'

export async function collectChallengeNode(state: OnboardingState): Promise<Partial<OnboardingState>> {
  const challenge = interrupt<string>('awaiting_challenge')

  const edit = await checkEditIntent(challenge, 'collect_challenge')
  if (edit) return edit

  await sendText(
    state.phone,
    'Mais uma coisa: tem algum *tema* que você gostaria pra história dessa vez? (ex: espaço, dinossauros, princesas)\n\nSe não tiver preferência, digite *não*.',
  )

  return { storyChallenge: challenge, editIntent: undefined }
}
