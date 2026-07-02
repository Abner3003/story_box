import { generationQueue } from '@storybox/queues'
import { sendText } from '../../../lib/whatsapp.js'
import type { OnboardingState } from '../onboarding.state.js'

export async function triggerGenerationNode(state: OnboardingState): Promise<Partial<OnboardingState>> {
  await Promise.all(
    state.collectionIds.map((collectionId, i) =>
      generationQueue.add('generate-book', {
        subscriberId: state.subscriberId,
        childId:      state.childIds[state.featuredChildIndices[i]],
        collectionId,
      }),
    ),
  )

  await sendText(
    state.phone,
    `🎨 Perfeito! Seu livro está sendo criado com muito carinho!\n\nAssim que ficar pronto, você recebe a versão digital como pŕevia aqui pelo WhatsApp 📚✨\n\nObrigada por fazer parte do *Storybox*! 💛`,
  )

  return {}
}
