import { sendButtons, sendText } from '../../../lib/whatsapp.js'
import type { OnboardingState } from '../onboarding.state.js'

const CONSENT_URL = process.env.STORYBOX_CONSENT_URL ?? 'https://storybox.com.br/consent'

export async function askConsentNode(state: OnboardingState): Promise<Partial<OnboardingState>> {
  await sendText(
    state.phone,
    `📋 *Autorização de uso de imagem (LGPD)*\n\nPara criar o livro personalizado, usamos a foto do seu filho para gerar as ilustrações. Leia os termos completos no link abaixo antes de responder:\n\n${CONSENT_URL}?phone=${encodeURIComponent(state.phone)}`,
  )

  await sendButtons(
    state.phone,
    'Após ler os termos, escolha uma opção:',
    [
      { id: 'consent_accept', title: '1 - Aceito' },
      { id: 'consent_decline', title: '2 - Não aceito' },
    ],
  )

  return {}
}
