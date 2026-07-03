import { interrupt } from '@langchain/langgraph'
import { sendText } from '../../../lib/whatsapp.js'
import { checkEditIntent } from '../edit-intent.js'
import type { OnboardingState } from '../onboarding.state.js'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function collectEmailNode(state: OnboardingState): Promise<Partial<OnboardingState>> {
  const raw = interrupt<string>('awaiting_email')

  const edit = await checkEditIntent(raw, 'collect_email')
  if (edit) return edit

  const email = raw.trim()

  if (!EMAIL_REGEX.test(email)) {
    await sendText(state.phone, '❌ E-mail inválido. Envie um e-mail válido, ex: nome@exemplo.com:')
    return { emailInvalid: true, editIntent: undefined }
  }

  await sendText(state.phone, 'Só mais um dado antes do pagamento: qual o seu *CPF*? (só números)')

  return { subscriberEmail: email, emailInvalid: false, editIntent: undefined }
}
