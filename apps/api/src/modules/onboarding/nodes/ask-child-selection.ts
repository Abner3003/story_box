import { sendText } from '../../../lib/whatsapp.js'
import type { OnboardingState } from '../onboarding.state.js'

export async function askChildSelectionNode(state: OnboardingState): Promise<Partial<OnboardingState>> {
  if (state.children.length <= 1) {
    return { featuredChildIndices: [0] }
  }

  const list = state.children.map((child, index) => `${index + 1}. ${child.name}`).join('\n')

  await sendText(
    state.phone,
    `Você cadastrou mais de um filho! 👨‍👩‍👧‍👦\n\nQuais deles vão ganhar o livro deste mês?\n\n${list}\n\nDigite os números separados por vírgula (ex: 1,3) ou *todos*:`,
  )

  return {}
}
