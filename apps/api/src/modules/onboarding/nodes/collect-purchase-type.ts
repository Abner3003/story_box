import { interrupt } from '@langchain/langgraph'
import { sendButtons, sendText } from '../../../lib/whatsapp.js'
import { looksLikeStrayMediaMessage } from '../../../lib/message-tags.js'
import type { OnboardingState } from '../onboarding.state.js'

export async function collectPurchaseTypeNode(state: OnboardingState): Promise<Partial<OnboardingState>> {
  const choice = interrupt<string>('awaiting_purchase_type')
  const trimmed = choice.trim()

  if (looksLikeStrayMediaMessage(trimmed)) {
    return { purchaseTypeInvalid: true }
  }

  if (trimmed === '1' || trimmed === 'purchase_one_time') {
    return { purchaseType: 'one_time', purchaseTypeInvalid: false }
  }
  if (trimmed === '2' || trimmed === 'purchase_subscription') {
    return { purchaseType: 'subscription', purchaseTypeInvalid: false }
  }

  await sendText(state.phone, '❌ Opção inválida. Escolha uma das opções abaixo:')
  await sendButtons(
    state.phone,
    'Escolha uma opção:',
    [
      { id: 'purchase_one_time', title: '1 - Livro único' },
      { id: 'purchase_subscription', title: '2 - Assinatura' },
    ],
  )
  return { purchaseTypeInvalid: true }
}
