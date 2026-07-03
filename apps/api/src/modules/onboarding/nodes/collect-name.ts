import { interrupt } from '@langchain/langgraph'
import { sendText } from '../../../lib/whatsapp.js'
import type { OnboardingState } from '../onboarding.state.js'

export async function collectNameNode(state: OnboardingState): Promise<Partial<OnboardingState>> {
  const raw = interrupt<string>('awaiting_subscriber_name')
  const name = raw.trim()

  await sendText(state.phone, `Prazer, ${name}! 💛\n\nVou te mostrar nossos planos agora...`)

  return { subscriberName: name }
}
