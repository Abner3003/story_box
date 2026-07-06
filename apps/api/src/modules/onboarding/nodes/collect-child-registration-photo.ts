import { interrupt } from '@langchain/langgraph'
import { sendText, downloadMedia } from '../../../lib/whatsapp.js'
import { extractVisualProfile } from '../../../lib/vision.js'
import { getSimulatedMedia, clearSimulatedMedia } from '../../../lib/simulate-media.js'
import { saveChildVisualProfile, uploadChildPhoto } from '../onboarding.repository.js'
import { checkEditIntent } from '../edit-intent.js'
import { maxChildrenForPlan } from '../max-children.js'
import type { OnboardingState } from '../onboarding.state.js'

const IMAGE_ID_RE = /^\[image:(.+)\]$/

function nextStepMessage(state: OnboardingState): string {
  if (state.childrenDone) {
    return `✅ ${state.children.length} filho(s) cadastrado(s)!`
  }
  const max = maxChildrenForPlan(state.plan)
  return `Quer adicionar outro filho? (${state.children.length}/${max})\nMande o *nome* ou *não* para continuar:`
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

    await sendText(state.phone, nextStepMessage(state))
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

    await sendText(state.phone, '📸 Foto recebida!')
    await sendText(state.phone, nextStepMessage(state))

    return { childRegistrationPhotoInvalid: false }
  } catch {
    await sendText(state.phone, '❌ Não consegui processar a foto. Envie novamente ou digite *não*:')
    return { childRegistrationPhotoInvalid: true }
  }
}
