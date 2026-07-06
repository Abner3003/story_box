import { sendText } from '../../../lib/whatsapp.js'
import type { OnboardingState } from '../onboarding.state.js'

export async function askFamilyMembersNode(state: OnboardingState): Promise<Partial<OnboardingState>> {
  await sendText(
    state.phone,
    `📸 Mais uma coisa: quer cadastrar outras pessoas da família (mamãe, papai, avós...) que podem aparecer nas histórias? Cadastrando com nome e foto, a ilustração fica muito mais parecida com a família de verdade.\n\nMe diz o *nome e quem é essa pessoa* (ex: "Ana, mamãe"), ou digite *não* pra pular.`,
  )
  return {}
}
