import { interrupt } from '@langchain/langgraph'
import { sendText } from '../../../lib/whatsapp.js'
import { checkEditIntent } from '../edit-intent.js'
import { upsertMonthlyCollection } from '../onboarding.repository.js'
import type { OnboardingState } from '../onboarding.state.js'

export async function collectChallengeNode(state: OnboardingState): Promise<Partial<OnboardingState>> {
  const challenge = interrupt<string>('awaiting_challenge')

  const edit = await checkEditIntent(challenge, 'collect_challenge')
  if (edit) return edit

  const currentIndex = state.featuredChildIndices[state.storyQueueIndex]
  const collectionId = await upsertMonthlyCollection({
    child_id:            state.childIds[currentIndex],
    subscriber_id:       state.subscriberId!,
    moment_text:         state.storyMoment ?? '',
    challenge_text:      challenge,
    photo_storage_path:  state.momentPhotoPath,
  })
  const collectionIds = [...state.collectionIds, collectionId]

  const nextQueueIndex = state.storyQueueIndex + 1
  const nextChild = state.children[state.featuredChildIndices[nextQueueIndex]]

  if (nextChild) {
    await sendText(
      state.phone,
      `✨ Anotado!\n\nAgora vamos falar de *${nextChild.name}*: você tem alguma *foto* de um momento especial dele(a) neste mês? Pode ser com a mamãe ou o papai também — se tiver, me manda! Se não, digite *não*.`,
    )
    return { collectionIds, storyQueueIndex: nextQueueIndex, momentPhotoPath: undefined, editIntent: undefined }
  }

  await sendText(state.phone, '✨ Informações salvas! Já vou criar a história...')

  return { collectionIds, storyQueueIndex: nextQueueIndex, editIntent: undefined }
}
