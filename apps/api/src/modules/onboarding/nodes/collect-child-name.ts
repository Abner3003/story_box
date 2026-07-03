import { interrupt } from '@langchain/langgraph'
import { sendText } from '../../../lib/whatsapp.js'
import { describeNameMeaning } from '../../../lib/name-meaning.js'
import { checkEditIntent } from '../edit-intent.js'
import type { OnboardingState } from '../onboarding.state.js'

const FALLBACK_INTRO = 'Que nome lindo! 💛'

export async function collectChildNameNode(state: OnboardingState): Promise<Partial<OnboardingState>> {
  const name = interrupt<string>(`awaiting_child_name_${state.children.length}`)

  const edit = await checkEditIntent(name, 'collect_child_name')
  if (edit) return edit

  const trimmedName = name.trim()

  let intro = FALLBACK_INTRO
  try {
    intro = await describeNameMeaning(trimmedName)
  } catch {
    intro = FALLBACK_INTRO
  }

  await sendText(state.phone, `${intro}\n\nQual a *data de nascimento* de ${trimmedName}? (DD/MM/AAAA)`)

  return { childDraftName: trimmedName, editIntent: undefined }
}
