import { interrupt } from '@langchain/langgraph'
import { sendText } from '../../../lib/whatsapp.js'
import type { OnboardingState } from '../onboarding.state.js'

export async function collectPurchaseTypeNode(state: OnboardingState): Promise<Partial<OnboardingState>> {
  const choice = interrupt<string>('awaiting_purchase_type')
  const trimmed = choice.trim()

  if (trimmed === '1') {
    return { purchaseType: 'one_time', purchaseTypeInvalid: false }
  }
  if (trimmed === '2') {
    return { purchaseType: 'subscription', purchaseTypeInvalid: false }
  }

  await sendText(state.phone, '❌ Opção inválida. Digite *1* para livro único ou *2* para assinatura:')
  return { purchaseTypeInvalid: true }
}
