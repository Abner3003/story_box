import { interrupt } from '@langchain/langgraph'
import { sendButtons, sendText } from '../../../lib/whatsapp.js'
import { MENU_BUTTONS } from './ask-menu.js'
import type { OnboardingState } from '../onboarding.state.js'

export async function collectMenuChoiceNode(state: OnboardingState): Promise<Partial<OnboardingState>> {
  const raw = interrupt<string>('awaiting_menu_choice')
  const trimmed = raw.trim()

  if (trimmed === 'menu_help' || trimmed === '1') {
    return { menuChoice: 'help', menuChoiceInvalid: false }
  }
  if (trimmed === 'menu_address' || trimmed === '2') {
    return { menuChoice: 'address', menuChoiceInvalid: false }
  }

  await sendText(state.phone, '❌ Não entendi. Escolha uma das opções abaixo:')
  await sendButtons(state.phone, 'Como posso te ajudar?', MENU_BUTTONS)
  return { menuChoiceInvalid: true }
}
