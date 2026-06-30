import { interrupt } from '@langchain/langgraph'
import { sendText, sendButtons } from '../../../lib/whatsapp.js'
import type { OnboardingState } from '../onboarding.state.js'

const CONSENT_URL = process.env.STORYBOX_CONSENT_URL ?? 'https://storybox.com.br/consent'

export async function awaitConsentNode(state: OnboardingState): Promise<Partial<OnboardingState>> {
  await sendText(
    state.phone,
    `📋 *Autorização de uso de imagem (LGPD)*\n\nPara criar o livro personalizado, usamos a foto do seu filho para gerar as ilustrações. Leia os termos completos no link abaixo antes de responder:\n\n${CONSENT_URL}?phone=${encodeURIComponent(state.phone)}`,
  )

  while (true) {
    await sendButtons(
      state.phone,
      'Após ler os termos, escolha uma opção:',
      [
        { id: 'consent_accept', title: '1 - Aceito' },
        { id: 'consent_decline', title: '2 - Não aceito' },
      ],
    )

    const reply = interrupt<string>('awaiting_consent')
    const normalized = reply.trim()

    if (normalized === '1' || normalized === 'consent_accept') {
      await sendText(state.phone, '✅ Autorização registrada! Vamos continuar.')
      return { imageConsentAccepted: true }
    }

    if (normalized === '2' || normalized === 'consent_decline') {
      await sendText(
        state.phone,
        '😢 Tudo bem! Sem a autorização não conseguimos personalizar o livro com a foto do seu filho.\n\nSe mudar de ideia, é só nos chamar aqui. Até logo! 👋',
      )
      return { imageConsentAccepted: false }
    }

    await sendText(state.phone, '❌ Por favor, escolha *1* para aceitar ou *2* para não aceitar.')
  }
}
