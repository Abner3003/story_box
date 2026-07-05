import { sendButtons, sendText } from '../../../lib/whatsapp.js'
import { getLatestBookForSubscriber, describeBookStatus } from '../../account/account.repository.js'
import type { OnboardingState } from '../onboarding.state.js'

const MENU_BUTTONS = [
  { id: 'menu_help', title: 'Ajuda' },
  { id: 'menu_address', title: 'Alterar endereço' },
  { id: 'menu_new_book', title: 'Gerar outro livro' },
]

export async function askMenuNode(state: OnboardingState): Promise<Partial<OnboardingState>> {
  if (state.subscriberId) {
    const book = await getLatestBookForSubscriber(state.subscriberId)
    if (book) {
      await sendText(
        state.phone,
        `Oi${state.subscriberName ? `, ${state.subscriberName}` : ''}! 👋\n\nVi que você já tem um livro criado — status atual: *${describeBookStatus(book.status)}*.`,
      )
    }
  }

  await sendButtons(state.phone, 'Como posso te ajudar?', MENU_BUTTONS)

  return {}
}

export { MENU_BUTTONS }
