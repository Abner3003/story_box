import { interrupt } from '@langchain/langgraph'
import { sendText } from '../../../lib/whatsapp.js'
import { checkEditIntent } from '../edit-intent.js'
import { upsertMonthlyCollection } from '../onboarding.repository.js'
import type { OnboardingState } from '../onboarding.state.js'

export async function collectThemeNode(state: OnboardingState): Promise<Partial<OnboardingState>> {
  const raw = interrupt<string>('awaiting_theme')

  const edit = await checkEditIntent(raw, 'collect_theme')
  if (edit) return edit

  const trimmed = raw.trim()
  const themePref = /^n(ão|ao)?$/i.test(trimmed) ? undefined : trimmed

  const currentIndex = state.featuredChildIndices[state.storyQueueIndex]
  const collectionId = await upsertMonthlyCollection({
    child_id:           state.childIds[currentIndex],
    subscriber_id:      state.subscriberId!,
    moment_text:        state.storyMoment ?? '',
    challenge_text:     state.storyChallenge ?? '',
    photo_storage_path: state.momentPhotoPath,
    theme_pref:         themePref,
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
