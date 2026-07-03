import { interrupt } from '@langchain/langgraph'
import { sendText } from '../../../lib/whatsapp.js'
import { isValidCpf } from '../../../lib/cpf.js'
import { checkEditIntent } from '../edit-intent.js'
import { updateSubscriberContact } from '../onboarding.repository.js'
import type { OnboardingState } from '../onboarding.state.js'

export async function collectCpfNode(state: OnboardingState): Promise<Partial<OnboardingState>> {
  const raw = interrupt<string>('awaiting_cpf')

  const edit = await checkEditIntent(raw, 'collect_cpf')
  if (edit) return edit

  const cpf = raw.trim().replace(/\D/g, '')

  if (!isValidCpf(cpf)) {
    await sendText(state.phone, '❌ CPF inválido. Confira os números e envie novamente:')
    return { cpfInvalid: true, editIntent: undefined }
  }

  if (state.subscriberId) {
    await updateSubscriberContact(state.subscriberId, { email: state.subscriberEmail, cpf })
  }

  return { subscriberCpf: cpf, cpfInvalid: false, editIntent: undefined }
}
