import { sendText } from '../../../lib/whatsapp.js'
import { createChild } from '../onboarding.repository.js'
import type { OnboardingState } from '../onboarding.state.js'

async function ensureChildrenSaved(state: OnboardingState): Promise<string[]> {
  if (state.childIds.length > 0) return state.childIds
  if (!state.subscriberId) return []

  const ids: string[] = []
  for (const child of state.children) {
    const id = await createChild({
      subscriber_id: state.subscriberId,
      name:          child.name,
      birth_date:    child.birthDate,
      image_consent: state.imageConsentAccepted ?? false,
    })
    ids.push(id)
  }
  return ids
}

export async function askPhotoNode(state: OnboardingState): Promise<Partial<OnboardingState>> {
  const childIds = await ensureChildrenSaved(state)
  const firstChild = state.children[state.featuredChildIndices[0] ?? 0]
  const name = firstChild?.name ?? 'seu filho'

  await sendText(
    state.phone,
    `📸 Agora me mande uma foto recente de *${name}*!\n\nDica: foto com boa iluminação e o rostinho bem visível 😊`,
  )

  return { childIds, photoQueueIndex: 0 }
}
