import { interrupt } from '@langchain/langgraph'
import { sendText, downloadMedia } from '../../../lib/whatsapp.js'
import { getSimulatedMedia, clearSimulatedMedia } from '../../../lib/simulate-media.js'
import { normalizeMediaForVision } from '../../../lib/media-frame.js'
import { uploadMomentPhoto } from '../onboarding.repository.js'
import { checkEditIntent } from '../edit-intent.js'
import type { OnboardingState } from '../onboarding.state.js'

const IMAGE_ID_RE = /^\[image:(.+)\]$/

function askMomentText(name: string) {
  return `💬 Agora me conta um *momento especial* de ${name} neste mês — pode ser algo engraçado, fofo ou marcante!\n\nExemplo: "Ela deu os primeiros passos e caiu rindo" 😄`
}

export async function collectMomentPhotoNode(state: OnboardingState): Promise<Partial<OnboardingState>> {
  const raw = interrupt<string>('awaiting_moment_photo')
  const currentIndex = state.featuredChildIndices[state.storyQueueIndex]
  const name = state.children[currentIndex]?.name ?? 'seu filho'

  const match = IMAGE_ID_RE.exec(raw)

  if (!match) {
    const edit = await checkEditIntent(raw, 'collect_moment_photo')
    if (edit) return edit

    if (!/^n(ão|ao)?$/i.test(raw.trim())) {
      await sendText(state.phone, '❌ Não entendi. Manda a foto desse momento ou digite *não* pra seguir sem foto:')
      return { momentPhotoInvalid: true }
    }

    await sendText(state.phone, askMomentText(name))
    return { momentPhotoPath: undefined, momentPhotoInvalid: false }
  }

  const mediaId = match[1]
  const currentChildId = state.childIds[currentIndex]

  try {
    let base64: string
    let mimeType: string

    if (mediaId.startsWith('sim:')) {
      const stored = getSimulatedMedia(mediaId)
      if (!stored) {
        await sendText(state.phone, '❌ Mídia simulada expirou. Envie a foto novamente ou digite *não*:')
        return { momentPhotoInvalid: true }
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

    const normalized = base64 ? await normalizeMediaForVision(base64, mimeType) : { base64, mimeType, source: 'image' as const }

    const photoPath = normalized.base64 && currentChildId
      ? await uploadMomentPhoto(currentChildId, normalized.base64, normalized.mimeType)
      : undefined

    await sendText(state.phone, `📸 Foto recebida! Vou usar pra deixar a ilustração ainda mais especial.\n\n${askMomentText(name)}`)

    return { momentPhotoPath: photoPath, momentPhotoInvalid: false }
  } catch {
    await sendText(state.phone, '❌ Não consegui processar a foto. Envie novamente ou digite *não*:')
    return { momentPhotoInvalid: true }
  }
}
