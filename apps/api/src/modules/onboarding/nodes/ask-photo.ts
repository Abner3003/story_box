import { sendText } from '../../../lib/whatsapp.js'
import { createChild, getChildById } from '../onboarding.repository.js'
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
  const currentIndex = state.featuredChildIndices[state.photoQueueIndex]
  const currentChildId = childIds[currentIndex]

  // Já tem foto e perfil visual salvos (do cadastro de filhos, mais cedo no
  // onboarding) — não precisa pedir de novo, só avança pro próximo da fila.
  // Se não tem (a família pulou a foto no cadastro), continua obrigatório
  // aqui — sem foto não tem como gerar o livro.
  if (currentChildId) {
    const existingChild = await getChildById(currentChildId)
    if (existingChild?.photo_storage_path && existingChild.visual_profile) {
      return { childIds, photoQueueIndex: state.photoQueueIndex + 1, photoAlreadyOnFile: true }
    }
  }

  const currentChild = state.children[currentIndex]
  const name = currentChild?.name ?? 'seu filho'

  await sendText(
    state.phone,
    `📸 Agora me mande uma foto recente de *${name}*!\n\nDica: foto com boa iluminação e o rostinho bem visível 😊`,
  )

  return { childIds, photoAlreadyOnFile: false }
}
