import { interrupt } from '@langchain/langgraph'
import { sendText, downloadMedia } from '../../../lib/whatsapp.js'
import { getSimulatedMedia, clearSimulatedMedia } from '../../../lib/simulate-media.js'
import { analyzeFamilyPhoto } from '../../../lib/vision.js'
import { uploadFamilyPhoto, saveFamilyAppearance } from '../onboarding.repository.js'
import { checkEditIntent } from '../edit-intent.js'
import type { OnboardingState } from '../onboarding.state.js'

const IMAGE_ID_RE = /^\[image:(.+)\]$/

export async function collectFamilyPhotoNode(state: OnboardingState): Promise<Partial<OnboardingState>> {
  const raw = interrupt<string>('awaiting_family_photo')

  const match = IMAGE_ID_RE.exec(raw)

  if (!match) {
    const edit = await checkEditIntent(raw, 'collect_family_photo')
    if (edit) return edit

    if (!/^n(ão|ao)?$/i.test(raw.trim())) {
      await sendText(state.phone, '❌ Não entendi. Manda a foto da família ou digite *não* pra seguir sem foto:')
      return { familyPhotoInvalid: true }
    }

    return { familyPhotoInvalid: false }
  }

  const mediaId = match[1]

  let base64: string
  let mimeType: string

  try {
    if (mediaId.startsWith('sim:')) {
      const stored = getSimulatedMedia(mediaId)
      if (!stored) {
        await sendText(state.phone, '❌ Mídia simulada expirou. Envie a foto novamente ou digite *não*:')
        return { familyPhotoInvalid: true }
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
  } catch {
    await sendText(state.phone, '❌ Não consegui processar a foto. Envie novamente ou digite *não*:')
    return { familyPhotoInvalid: true }
  }

  if (!base64 || !state.subscriberId) {
    await sendText(state.phone, '📸 Foto da família recebida! Vou usar pra deixar as ilustrações mais especiais.')
    return { familyPhotoInvalid: false }
  }

  let photoPath: string
  let analysis: Awaited<ReturnType<typeof analyzeFamilyPhoto>>

  try {
    photoPath = await uploadFamilyPhoto(state.subscriberId, base64, mimeType)
    analysis = await analyzeFamilyPhoto(base64, mimeType)
  } catch {
    await sendText(state.phone, '❌ Não consegui processar a foto. Envie novamente ou digite *não*:')
    return { familyPhotoInvalid: true }
  }

  const recognizedLine = analysis.recognized.length
    ? `📸 Foto da família recebida! Pelo que eu vi: ${analysis.recognized.join(', ')}.`
    : '📸 Foto da família recebida!'

  if (analysis.unclearNote) {
    await sendText(
      state.phone,
      `${recognizedLine}\n\nVi também ${analysis.unclearNote} na foto — quem é essa pessoa? (ex: "é o irmão dele, o Lucas")`,
    )

    return {
      familyPhotoInvalid: false,
      familyUnclearNote: analysis.unclearNote,
      familyPhotoPathPending: photoPath,
      familyDescriptionPending: analysis.illustrationDescription,
    }
  }

  await sendText(state.phone, `${recognizedLine} Vou usar pra deixar as ilustrações mais especiais.`)
  await saveFamilyAppearance(state.subscriberId, photoPath, analysis.illustrationDescription)

  return { familyPhotoInvalid: false, familyUnclearNote: undefined }
}
