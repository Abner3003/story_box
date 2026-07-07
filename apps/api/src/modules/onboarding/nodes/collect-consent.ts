import { interrupt } from '@langchain/langgraph'
import { sendButtons, sendText } from '../../../lib/whatsapp.js'
import { checkEditIntent } from '../edit-intent.js'
import type { OnboardingState } from '../onboarding.state.js'

export async function collectConsentNode(state: OnboardingState): Promise<Partial<OnboardingState>> {
  const reply = interrupt<string>('awaiting_consent')

  const edit = await checkEditIntent(reply, 'collect_consent')
  if (edit) return edit

  const normalized = reply.trim()

  if (normalized === '1' || normalized === 'consent_accept') {
    await sendText(state.phone, '✅ Autorização registrada! Vamos continuar.')
    return { imageConsentAccepted: true, consentInvalid: false, editIntent: undefined }
  }

  if (normalized === '2' || normalized === 'consent_decline') {
    await sendText(
      state.phone,
      '😢 Tudo bem! Sem a autorização não conseguimos personalizar o livro com a foto do seu filho.\n\nSe mudar de ideia, é só nos chamar aqui. Até logo! 👋',
    )
    return { imageConsentAccepted: false, consentInvalid: false, editIntent: undefined }
  }

  await sendButtons(
    state.phone,
    '❌ Por favor, escolha *1* para aceitar ou *2* para não aceitar:',
    [
      { id: 'consent_accept', title: '1 - Aceito' },
      { id: 'consent_decline', title: '2 - Não aceito' },
    ],
  )
  return { consentInvalid: true, editIntent: undefined }
}
