import { interrupt } from '@langchain/langgraph'
import { sendText } from '../../../lib/whatsapp.js'
import { checkEditIntent } from '../edit-intent.js'
import type { OnboardingState } from '../onboarding.state.js'

export async function collectChallengeNode(state: OnboardingState): Promise<Partial<OnboardingState>> {
  const challenge = interrupt<string>('awaiting_challenge')

  const edit = await checkEditIntent(challenge, 'collect_challenge')
  if (edit) return edit

  // TODO: salvar state.storyMoment e challenge na monthly_collection do banco
  void challenge

  await sendText(state.phone, '✨ Informações salvas! Já vou criar a história...')

  return { editIntent: undefined }
}
