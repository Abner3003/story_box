import { sendText } from '../../../lib/whatsapp.js'
import type { OnboardingState } from '../onboarding.state.js'

export async function askChildrenNode(state: OnboardingState): Promise<Partial<OnboardingState>> {
  await sendText(state.phone, 'Agora vou conhecer seu(s) filho(s)! 👶\n\nQual o *nome* do 1º filho?')
  return {
    children: [],
    childIds: [],
    featuredChildIndices: [],
    childrenDone: false,
    editIntent: undefined,
    returnTo: undefined,
  }
}
