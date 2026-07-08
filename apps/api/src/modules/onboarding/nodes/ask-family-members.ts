import { sendButtons } from '../../../lib/whatsapp.js'
import { FAMILY_DONE_BUTTON } from './collect-family-member-info.js'
import type { OnboardingState } from '../onboarding.state.js'

export async function askFamilyMembersNode(state: OnboardingState): Promise<Partial<OnboardingState>> {
  await sendButtons(
    state.phone,
    `📸 Mais uma coisa: quer cadastrar outras pessoas da família (mamãe, papai, avós...) que podem aparecer nas histórias? Cadastrando com nome e foto, a ilustração fica muito mais parecida com a família de verdade.\n\nVocê pode me mandar o *nome e quem é essa pessoa* (ex: "Ana, mamãe") ou já enviar *foto + texto juntos* (ex: foto da mamãe com a legenda "Ana, mamãe"). Também pode tocar em "Terminei" pra pular:`,
    [FAMILY_DONE_BUTTON],
  )
  return {}
}
