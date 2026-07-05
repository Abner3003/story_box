import { interrupt } from '@langchain/langgraph'
import { sendText, downloadMedia } from '../../../lib/whatsapp.js'
import { getSimulatedMedia, clearSimulatedMedia } from '../../../lib/simulate-media.js'
import { analyzeFamilyPhoto } from '../../../lib/vision.js'
import { uploadFamilyPhoto, saveFamilyAppearance } from '../onboarding.repository.js'
import { checkEditIntent } from '../edit-intent.js'
import type { OnboardingState } from '../onboarding.state.js'

const IMAGE_ID_RE = /^\[image:(.+)\]$/

const MALE_HINT_RE = /\b(irmão|filho|menino|neto|sobrinho|primo|garoto)\b/i
const FEMALE_HINT_RE = /\b(irmã|filha|menina|neta|sobrinha|prima|garota)\b/i

function inferGenderHint(text: string): string | null {
  if (MALE_HINT_RE.test(text)) return 'male'
  if (FEMALE_HINT_RE.test(text)) return 'female'
  return null
}

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

  try {
    let base64: string
    let mimeType: string

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

    if (base64 && state.subscriberId) {
      const photoPath = await uploadFamilyPhoto(state.subscriberId, base64, mimeType)
      const analysis = await analyzeFamilyPhoto(base64, mimeType)

      const recognizedLine = analysis.recognized.length
        ? `📸 Foto da família recebida! Pelo que eu vi: ${analysis.recognized.join(', ')}.`
        : '📸 Foto da família recebida!'

      let description = analysis.illustrationDescription

      if (analysis.unclearNote) {
        await sendText(
          state.phone,
          `${recognizedLine}\n\nVi também ${analysis.unclearNote} na foto — quem é essa pessoa? (ex: "é o irmão dele, o Lucas")`,
        )

        const clarification = interrupt<string>('awaiting_family_clarification')
        const genderHint = inferGenderHint(clarification)
        const genderLine = genderHint ? `a ${genderHint} child` : 'a child'
        description = [
          description,
          `Additional family member — ${genderLine}, as described by the parent: "${clarification.trim()}".`,
        ].filter(Boolean).join('\n')

        await sendText(state.phone, 'Anotado! Vou usar pra deixar as ilustrações mais especiais.')
      } else {
        await sendText(state.phone, `${recognizedLine} Vou usar pra deixar as ilustrações mais especiais.`)
      }

      await saveFamilyAppearance(state.subscriberId, photoPath, description)
    } else {
      await sendText(state.phone, '📸 Foto da família recebida! Vou usar pra deixar as ilustrações mais especiais.')
    }

    return { familyPhotoInvalid: false }
  } catch {
    await sendText(state.phone, '❌ Não consegui processar a foto. Envie novamente ou digite *não*:')
    return { familyPhotoInvalid: true }
  }
}
