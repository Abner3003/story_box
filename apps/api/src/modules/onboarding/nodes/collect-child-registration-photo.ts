import { interrupt } from '@langchain/langgraph'
import { sendButtons, sendText, downloadMedia } from '../../../lib/whatsapp.js'
import { extractVisualProfile } from '../../../lib/vision.js'
import { getSimulatedMedia, clearSimulatedMedia } from '../../../lib/simulate-media.js'
import { saveChildVisualProfile, uploadChildPhoto } from '../onboarding.repository.js'
import { checkEditIntent } from '../edit-intent.js'
import { maxChildrenForPlan } from '../max-children.js'
import { CHILDREN_DONE_BUTTON } from './collect-more-children.js'
import type { OnboardingState } from '../onboarding.state.js'

const IMAGE_ID_RE = /^\[image:(.+)\]$/

// Botão nativo em vez de "digite não pra continuar" — "não" pra seguir em
// frente é uma instrução confusa (não geralmente significa parar, não seguir).
// Aceita um prefixo pra juntar com a mensagem anterior (ex: "Foto recebida!")
// numa mensagem só, em vez de duas seguidas — evita bater no rate limit do
// WhatsApp de mensagens em sequência pro mesmo número.
async function sendNextStepPrompt(state: OnboardingState, prefix?: string): Promise<void> {
  const lead = prefix ? `${prefix}\n\n` : ''

  if (state.childrenDone) {
    await sendText(state.phone, `${lead}✅ ${state.children.length} filho(s) cadastrado(s)!`)
    return
  }
  const max = maxChildrenForPlan(state.plan)
  await sendButtons(
    state.phone,
    `${lead}Quer adicionar outro filho? (${state.children.length}/${max})\nMande o *nome* do próximo, ou toque em "Terminei" pra seguir:`,
    [CHILDREN_DONE_BUTTON],
  )
}

export async function collectChildRegistrationPhotoNode(state: OnboardingState): Promise<Partial<OnboardingState>> {
  const raw = interrupt<string>(`awaiting_child_registration_photo_${state.children.length}`)

  const match = IMAGE_ID_RE.exec(raw)

  if (!match) {
    const edit = await checkEditIntent(raw, 'collect_child_registration_photo')
    if (edit) return edit

    if (!/^n(ão|ao)?$/i.test(raw.trim())) {
      await sendText(state.phone, '❌ Não entendi. Manda a foto ou digite *não* pra pular:')
      return { childRegistrationPhotoInvalid: true }
    }

    await sendNextStepPrompt(state)
    return { childRegistrationPhotoInvalid: false }
  }

  const mediaId = match[1]
  const childId = state.childIds[state.childIds.length - 1]

  try {
    let base64: string
    let mimeType: string

    if (mediaId.startsWith('sim:')) {
      const stored = getSimulatedMedia(mediaId)
      if (!stored) {
        await sendText(state.phone, '❌ Mídia simulada expirou. Envie a foto novamente ou digite *não*:')
        return { childRegistrationPhotoInvalid: true }
      }
      base64 = stored.base64
      mimeType = stored.mimeType
      clearSimulatedMedia(mediaId)
    } else if (state.simulate) {
      base64 = ''
      mimeType = 'image/jpeg'
    } else {
      const media = await downloadMedia(mediaId)
      base64 = media.base64
      mimeType = media.mimeType
    }

    if (base64 && childId) {
      const profile = await extractVisualProfile(base64, mimeType)
      const photoPath = await uploadChildPhoto(childId, base64, mimeType)
      await saveChildVisualProfile(childId, profile, photoPath)
    }

    await sendNextStepPrompt(state, '📸 Foto recebida!')

    return { childRegistrationPhotoInvalid: false }
  } catch {
    await sendText(state.phone, '❌ Não consegui processar a foto. Envie novamente ou digite *não*:')
    return { childRegistrationPhotoInvalid: true }
  }
}
