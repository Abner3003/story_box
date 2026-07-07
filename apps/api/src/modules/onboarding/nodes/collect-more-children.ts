import { interrupt } from '@langchain/langgraph'
import { sendText } from '../../../lib/whatsapp.js'
import { describeNameMeaning } from '../../../lib/name-meaning.js'
import { checkEditIntent } from '../edit-intent.js'
import { looksLikeStrayMediaMessage } from '../../../lib/message-tags.js'
import type { OnboardingState } from '../onboarding.state.js'

const FALLBACK_INTRO = 'Que nome lindo! 💛'

export const CHILDREN_DONE_BUTTON = { id: 'children_done', title: 'Terminei' }

export async function collectMoreChildrenNode(state: OnboardingState): Promise<Partial<OnboardingState>> {
  const raw = interrupt<string>(`awaiting_more_children_${state.children.length}`)

  const edit = await checkEditIntent(raw, 'collect_more_children')
  if (edit) return edit

  const trimmed = raw.trim()

  if (looksLikeStrayMediaMessage(trimmed)) {
    await sendText(
      state.phone,
      '❌ Não entendi. Se quiser adicionar outro filho, me mande o *nome* dele(a). Se já terminou, toque em "Terminei".',
    )
    return { moreChildrenInvalid: true, childrenDone: false, editIntent: undefined }
  }

  if (/^n(ão|ao)?$/i.test(trimmed) || trimmed === CHILDREN_DONE_BUTTON.id || trimmed === CHILDREN_DONE_BUTTON.title) {
    await sendText(state.phone, `✅ ${state.children.length} filho(s) cadastrado(s)!`)
    return { childrenDone: true, moreChildrenInvalid: false, editIntent: undefined }
  }

  let intro = FALLBACK_INTRO
  try {
    intro = await describeNameMeaning(trimmed)
  } catch {
    intro = FALLBACK_INTRO
  }

  await sendText(state.phone, `${intro}\n\nQual a *data de nascimento* de ${trimmed}? (DD/MM/AAAA)`)
  return { childDraftName: trimmed, childrenDone: false, moreChildrenInvalid: false, editIntent: undefined }
}
