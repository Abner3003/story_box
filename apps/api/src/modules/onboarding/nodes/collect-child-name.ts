import { interrupt } from '@langchain/langgraph'
import { sendText } from '../../../lib/whatsapp.js'
import { checkEditIntent } from '../edit-intent.js'
import type { OnboardingState } from '../onboarding.state.js'

export async function collectChildNameNode(state: OnboardingState): Promise<Partial<OnboardingState>> {
  const name = interrupt<string>(`awaiting_child_name_${state.children.length}`)

  const edit = await checkEditIntent(name, 'collect_child_name')
  if (edit) return edit

  await sendText(state.phone, `Que nome lindo! 💛\n\nQual a *data de nascimento* de ${name.trim()}? (DD/MM/AAAA)`)

  return { childDraftName: name.trim(), editIntent: undefined }
}
