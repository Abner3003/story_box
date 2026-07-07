import { sendButtons, sendText } from '../../../lib/whatsapp.js'
import { getLatestBookForSubscriber, describeBookStatus } from '../../account/account.repository.js'
import { formatOptionsList } from './show-plans.js'
import type { OnboardingState } from '../onboarding.state.js'

const MAX_NATIVE_BUTTONS = 3

const MENU_OPTIONS = [
  { id: 'menu_help', title: 'Ajuda' },
  { id: 'menu_address', title: 'Alterar endereço' },
  { id: 'menu_new_book', title: 'Gerar outro livro' },
  { id: 'menu_family', title: 'Cadastrar família' },
]

async function sendMenu(phone: string, prefix?: string): Promise<void> {
  const lead = prefix ? `${prefix}\n\n` : ''

  if (MENU_OPTIONS.length <= MAX_NATIVE_BUTTONS) {
    await sendButtons(phone, `${lead}Como posso te ajudar?`, MENU_OPTIONS)
    return
  }

  const list = MENU_OPTIONS.map((opt, i) => `*${i + 1}* - ${opt.title}`).join('\n')
  await sendText(phone, `${lead}Como posso te ajudar?\n\n${list}\n\nDigite ${formatOptionsList(MENU_OPTIONS.length)}:`)
}

export async function askMenuNode(state: OnboardingState): Promise<Partial<OnboardingState>> {
  let prefix: string | undefined

  if (state.subscriberId) {
    const book = await getLatestBookForSubscriber(state.subscriberId)
    if (book) {
      prefix = `Oi${state.subscriberName ? `, ${state.subscriberName}` : ''}! 👋\n\nVi que você já tem um livro criado — status atual: *${describeBookStatus(book.status)}*.`
    }
  }

  await sendMenu(state.phone, prefix)

  return {}
}

export { MENU_OPTIONS, sendMenu }
