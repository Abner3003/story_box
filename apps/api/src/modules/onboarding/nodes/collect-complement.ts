import { interrupt } from '@langchain/langgraph'
import { sendText } from '../../../lib/whatsapp.js'
import { checkEditIntent } from '../edit-intent.js'
import type { AddressInput, OnboardingState } from '../onboarding.state.js'

export async function collectComplementNode(state: OnboardingState): Promise<Partial<OnboardingState>> {
  const raw = interrupt<string>('awaiting_complement')

  const edit = await checkEditIntent(raw, 'collect_complement')
  if (edit) return edit

  const complement = /^n(ão|ao)?$/i.test(raw.trim()) ? undefined : raw.trim()

  if (!state.addressDraft || !state.addressNumber) {
    throw new Error('Endereço incompleto no estado do onboarding')
  }

  const address: AddressInput = {
    ...state.addressDraft,
    number: state.addressNumber,
    complement,
  }

  await sendText(state.phone, '✅ Endereço salvo!')

  return { address, editIntent: undefined }
}
