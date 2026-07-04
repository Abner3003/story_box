import { sendText, sendVideo } from '../../../lib/whatsapp.js'
import type { OnboardingState } from '../onboarding.state.js'

const INTRO_VIDEO_URL = process.env.STORYBOX_INTRO_VIDEO_URL ?? ''

export async function welcomeNode(state: OnboardingState): Promise<Partial<OnboardingState>> {
  if (INTRO_VIDEO_URL) {
    await sendVideo(state.phone, INTRO_VIDEO_URL, 'Bem-vinda ao Era Uma Vez Eu! 🌟')
  }

  await sendText(
    state.phone,
    `Olá! 👋 Sou a assistente do *Era Uma Vez Eu* 📚✨\n\nCriamos livros infantis personalizados com o seu filho como personagem principal — com a carinha, o cabelo e o jeitinho dele!\n\nAntes de começar, qual é o seu nome?`,
  )

  return {}
}
