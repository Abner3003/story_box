import { sendText } from '../../../lib/whatsapp.js'
import type { OnboardingState } from '../onboarding.state.js'

export async function askAddressNode(state: OnboardingState): Promise<Partial<OnboardingState>> {
  await sendText(state.phone, 'Agora preciso do endereço para a entrega 📦\n\nQual é o seu *CEP*? (somente números, ex: 01310100)')
  return { editIntent: undefined }
}
