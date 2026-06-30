import { interrupt } from '@langchain/langgraph'
import { sendText } from '../../../lib/whatsapp.js'
import type { OnboardingState } from '../onboarding.state.js'

export async function collectStoryNode(state: OnboardingState): Promise<Partial<OnboardingState>> {
  const firstName = state.children[0]?.name ?? 'seu filho'

  await sendText(
    state.phone,
    `💬 Agora me conta um *momento especial* de ${firstName} neste mês — pode ser algo engraçado, fofo ou marcante!\n\nExemplo: "Ela deu os primeiros passos e caiu rindo" 😄`,
  )

  const moment = interrupt<string>('awaiting_moment')

  await sendText(
    state.phone,
    `Adorei! 💛\n\nTem algum *desafio ou aprendizado* que ${firstName} está passando? Isso enriquece a história!\n\nExemplo: "Está aprendendo a comer sozinha"`,
  )

  const challenge = interrupt<string>('awaiting_challenge')

  // TODO: salvar moment e challenge na monthly_collection do banco
  void moment; void challenge

  await sendText(state.phone, '✨ Informações salvas! Já vou criar a história...')

  return {}
}
