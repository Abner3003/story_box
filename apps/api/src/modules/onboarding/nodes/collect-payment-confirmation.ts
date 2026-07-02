import { interrupt } from '@langchain/langgraph'
import { sendText } from '../../../lib/whatsapp.js'
import { markSubscriberActiveByPhone } from '../onboarding.repository.js'
import { checkEditIntent } from '../edit-intent.js'
import type { OnboardingState } from '../onboarding.state.js'

export async function collectPaymentConfirmationNode(state: OnboardingState): Promise<Partial<OnboardingState>> {
  const msg = interrupt<string>('awaiting_payment_confirmation')

  if (msg !== 'billing.paid') {
    const edit = await checkEditIntent(msg, 'collect_payment_confirmation')
    if (edit) return edit
  }

  const lower = msg.toLowerCase()
  const confirmed = msg === 'billing.paid' || lower.includes('paguei') || lower.includes('pago') || lower.includes('ok')

  if (confirmed) {
    await sendText(state.phone, '🎉 Pagamento confirmado! Vamos continuar o seu cadastro.')
    const subscriberId = await markSubscriberActiveByPhone(state.phone)
    return { subscriberId: subscriberId ?? state.subscriberId, paymentConfirmed: true, editIntent: undefined, returnTo: undefined }
  }

  await sendText(state.phone, `Ainda não recebi a confirmação. Tente o link novamente:\n${state.paymentLink}`)
  return { editIntent: undefined }
}
