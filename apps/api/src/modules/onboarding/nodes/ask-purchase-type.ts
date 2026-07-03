import { sendButtons, sendText } from '../../../lib/whatsapp.js'
import type { OnboardingState } from '../onboarding.state.js'

export async function askPurchaseTypeNode(state: OnboardingState): Promise<Partial<OnboardingState>> {
  await sendText(
    state.phone,
    'Como você quer começar?\n\n*1 - Livro único* (pagamento no cartão ou PIX) — ideal pra presentear 🎁\n*2 - Assinatura* (livro novo toda semana, app de leitura e muito mais, todo mês) 📚',
  )

  await sendButtons(
    state.phone,
    'Escolha uma opção:',
    [
      { id: 'purchase_one_time', title: '1 - Livro único' },
      { id: 'purchase_subscription', title: '2 - Assinatura' },
    ],
  )

  return {}
}
