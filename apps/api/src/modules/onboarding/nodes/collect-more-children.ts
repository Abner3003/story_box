import { interrupt } from '@langchain/langgraph'
import { sendText } from '../../../lib/whatsapp.js'
import { describeNameMeaning } from '../../../lib/name-meaning.js'
import { checkEditIntent } from '../edit-intent.js'
import type { OnboardingState } from '../onboarding.state.js'

const FALLBACK_INTRO = 'Que nome lindo! 💛'

export const CHILDREN_DONE_BUTTON = { id: 'children_done', title: 'Terminei' }

export async function collectMoreChildrenNode(state: OnboardingState): Promise<Partial<OnboardingState>> {
  const raw = interrupt<string>(`awaiting_more_children_${state.children.length}`)

  const edit = await checkEditIntent(raw, 'collect_more_children')
  if (edit) return edit

  const trimmed = raw.trim()

  if (/^n(ão|ao)?$/i.test(trimmed) || trimmed === CHILDREN_DONE_BUTTON.id) {
    await sendText(state.phone, `✅ ${state.children.length} filho(s) cadastrado(s)!`)
    return { childrenDone: true, editIntent: undefined }
  }

  let intro = FALLBACK_INTRO
  try {
    intro = await describeNameMeaning(trimmed)
  } catch {
    intro = FALLBACK_INTRO
  }

  await sendText(state.phone, `${intro}\n\nQual a *data de nascimento* de ${trimmed}? (DD/MM/AAAA)`)
  return { childDraftName: trimmed, childrenDone: false, editIntent: undefined }
}
