import { interrupt } from '@langchain/langgraph'
import { sendText } from '../../../lib/whatsapp.js'
import { checkEditIntent } from '../edit-intent.js'
import type { OnboardingState } from '../onboarding.state.js'

export async function collectNumberNode(state: OnboardingState): Promise<Partial<OnboardingState>> {
  const number = interrupt<string>('awaiting_number')

  const edit = await checkEditIntent(number, 'collect_number')
  if (edit) return edit

  await sendText(state.phone, 'Tem *complemento*? (apto, bloco...) Se não tiver, mande *não*:')

  return { addressNumber: number.trim(), editIntent: undefined }
}
