import { sendText } from '../../../lib/whatsapp.js'
import type { OnboardingState } from '../onboarding.state.js'

export async function triggerGenerationNode(state: OnboardingState): Promise<Partial<OnboardingState>> {
  // TODO: enfileirar job na generationQueue com os dados coletados
  // await generationQueue.add('generate-book', { subscriberId: state.subscriberId, ... })

  await sendText(
    state.phone,
    `🎨 Perfeito! Seu livro está sendo criado com muito carinho!\n\nAssim que ficar pronto, você recebe aqui pelo WhatsApp 📚✨\n\nObrigada por fazer parte do *Storybox*! 💛`,
  )

  return {}
}
