import { interrupt } from '@langchain/langgraph'
import { sendText } from '../../../lib/whatsapp.js'
import { checkEditIntent } from '../edit-intent.js'
import { upsertMonthlyCollection } from '../onboarding.repository.js'
import type { OnboardingState } from '../onboarding.state.js'

export async function collectChallengeNode(state: OnboardingState): Promise<Partial<OnboardingState>> {
  const challenge = interrupt<string>('awaiting_challenge')

  const edit = await checkEditIntent(challenge, 'collect_challenge')
  if (edit) return edit

  const collectionIds = await Promise.all(
    state.featuredChildIndices.map((i) =>
      upsertMonthlyCollection({
        child_id:       state.childIds[i],
        subscriber_id:  state.subscriberId!,
        moment_text:    state.storyMoment ?? '',
        challenge_text: challenge,
      }),
    ),
  )

  await sendText(state.phone, '✨ Informações salvas! Já vou criar a história...')

  return { collectionIds, editIntent: undefined }
}
