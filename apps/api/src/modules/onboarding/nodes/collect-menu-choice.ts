import { interrupt } from '@langchain/langgraph'
import { sendText } from '../../../lib/whatsapp.js'
import { MENU_OPTIONS, sendMenu } from './ask-menu.js'
import type { OnboardingState } from '../onboarding.state.js'

const CHOICE_BY_ID: Record<string, NonNullable<OnboardingState['menuChoice']>> = {
  menu_help: 'help',
  menu_address: 'address',
  menu_new_book: 'new_book',
  menu_family: 'family',
}

export async function collectMenuChoiceNode(state: OnboardingState): Promise<Partial<OnboardingState>> {
  const raw = interrupt<string>('awaiting_menu_choice')
  const trimmed = raw.trim()

  const byIndex = /^\d+$/.test(trimmed) ? MENU_OPTIONS[Number(trimmed) - 1]?.id : undefined
  const choice = CHOICE_BY_ID[trimmed] ?? (byIndex ? CHOICE_BY_ID[byIndex] : undefined)

  if (choice) {
    return { menuChoice: choice, menuChoiceInvalid: false }
  }

  await sendText(state.phone, '❌ Não entendi. Escolha uma das opções abaixo:')
  await sendMenu(state.phone)
  return { menuChoiceInvalid: true }
}
