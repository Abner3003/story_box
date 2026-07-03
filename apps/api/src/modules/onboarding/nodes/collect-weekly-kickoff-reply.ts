import { interrupt } from '@langchain/langgraph'
import type { OnboardingState } from '../onboarding.state.js'

// Qualquer resposta do cliente já reabre a janela de 24h do WhatsApp — o
// conteúdo em si não importa, só precisamos que ele responda pra continuar
// com mensagens de texto livre a partir daqui.
export async function collectWeeklyKickoffReplyNode(_state: OnboardingState): Promise<Partial<OnboardingState>> {
  interrupt<string>('awaiting_weekly_kickoff_reply')

  return {}
}
