import { interrupt } from '@langchain/langgraph'
import { sendText } from '../../../lib/whatsapp.js'
import { checkEditIntent } from '../edit-intent.js'
import type { OnboardingState } from '../onboarding.state.js'

export async function collectMoreChildrenNode(state: OnboardingState): Promise<Partial<OnboardingState>> {
  const raw = interrupt<string>(`awaiting_more_children_${state.children.length}`)

  const edit = await checkEditIntent(raw, 'collect_more_children')
  if (edit) return edit

  const trimmed = raw.trim()

  if (/^n(ão|ao)?$/i.test(trimmed)) {
    await sendText(state.phone, `✅ ${state.children.length} filho(s) cadastrado(s)!`)
    return { childrenDone: true, editIntent: undefined }
  }

  await sendText(state.phone, `Qual a *data de nascimento* de ${trimmed}? (DD/MM/AAAA)`)
  return { childDraftName: trimmed, childrenDone: false, editIntent: undefined }
}
