import { interrupt } from '@langchain/langgraph'
import { sendText } from '../../../lib/whatsapp.js'
import { checkEditIntent } from '../edit-intent.js'
import { saveChildStyleChoice } from '../onboarding.repository.js'
import { formatOptionsList } from './show-plans.js'
import type { OnboardingState } from '../onboarding.state.js'

async function advance(state: OnboardingState): Promise<Partial<OnboardingState>> {
  const nextQueueIndex = state.photoQueueIndex + 1
  const nextChild = state.children[state.featuredChildIndices[nextQueueIndex]]

  if (nextChild) {
    await sendText(state.phone, `✅ Estilo definido!\n\n📸 Agora me mande uma foto recente de *${nextChild.name}*!`)
  } else {
    await sendText(state.phone, '✅ Foto e estilo definidos! Perfil visual criado com sucesso.')
  }

  return { photoQueueIndex: nextQueueIndex, styleChoiceInvalid: false, styleOptions: [], editIntent: undefined }
}

export async function collectStyleChoiceNode(state: OnboardingState): Promise<Partial<OnboardingState>> {
  // Nenhuma opção gerada (sem foto real) — segue direto sem perguntar nada
  if (state.styleOptions.length === 0) {
    return advance(state)
  }

  const choice = interrupt<string>('awaiting_style_choice')

  const edit = await checkEditIntent(choice, 'collect_style_choice')
  if (edit) return edit

  const trimmed = choice.trim()
  const index = Number.parseInt(trimmed, 10) - 1
  const selected = state.styleOptions[index] ?? state.styleOptions.find((opt) => opt.id === trimmed)

  if (!selected) {
    await sendText(state.phone, `❌ Opção inválida. Digite ${formatOptionsList(state.styleOptions.length)}:`)
    return { styleChoiceInvalid: true }
  }

  const currentIndex = state.featuredChildIndices[state.photoQueueIndex]
  const currentChildId = state.childIds[currentIndex]
  if (currentChildId) await saveChildStyleChoice(currentChildId, selected.id)

  return advance(state)
}
