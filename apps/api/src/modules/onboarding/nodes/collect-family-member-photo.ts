import { interrupt } from '@langchain/langgraph'
import { sendText, downloadMedia } from '../../../lib/whatsapp.js'
import { extractVisualProfile } from '../../../lib/vision.js'
import { getSimulatedMedia, clearSimulatedMedia } from '../../../lib/simulate-media.js'
import { createFamilyMember, saveFamilyMemberVisualProfile, uploadFamilyMemberPhoto } from '../onboarding.repository.js'
import { checkEditIntent } from '../edit-intent.js'
import type { OnboardingState } from '../onboarding.state.js'

const IMAGE_ID_RE = /^\[image:(.+)\]$/

function nextStepMessage(): string {
  return 'Quer cadastrar mais alguém? Me diz o *nome e quem é essa pessoa* (ex: "Ana, mamãe"), ou digite *não* pra seguir:'
}

export async function collectFamilyMemberPhotoNode(state: OnboardingState): Promise<Partial<OnboardingState>> {
  const raw = interrupt<string>('awaiting_family_member_photo')

  const match = IMAGE_ID_RE.exec(raw)
  const name = state.familyMemberDraftName ?? 'essa pessoa'

  if (!match) {
    const edit = await checkEditIntent(raw, 'collect_family_member_photo')
    if (edit) return edit

    if (!/^n(ão|ao)?$/i.test(raw.trim())) {
      await sendText(state.phone, '❌ Não entendi. Manda a foto ou digite *não* pra pular:')
      return { familyMemberPhotoInvalid: true }
    }

    // Pulou a foto — ainda cadastra a pessoa só com nome/papel.
    if (state.subscriberId) {
      await createFamilyMember({ subscriber_id: state.subscriberId, name, role: state.familyMemberDraftRole })
    }
    await sendText(state.phone, nextStepMessage())
    return { familyMemberPhotoInvalid: false, familyMemberDraftName: undefined, familyMemberDraftRole: undefined }
  }

  const mediaId = match[1]

  try {
    let base64: string
    let mimeType: string

    if (mediaId.startsWith('sim:')) {
      const stored = getSimulatedMedia(mediaId)
      if (!stored) {
        await sendText(state.phone, '❌ Mídia simulada expirou. Envie a foto novamente ou digite *não*:')
        return { familyMemberPhotoInvalid: true }
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

    if (state.subscriberId) {
      const memberId = await createFamilyMember({ subscriber_id: state.subscriberId, name, role: state.familyMemberDraftRole })

      if (base64) {
        const profile = await extractVisualProfile(base64, mimeType)
        const photoPath = await uploadFamilyMemberPhoto(memberId, base64, mimeType)
        await saveFamilyMemberVisualProfile(memberId, profile, photoPath)
      }
    }

    await sendText(state.phone, `📸 ${name} cadastrado(a)!`)
    await sendText(state.phone, nextStepMessage())

    return { familyMemberPhotoInvalid: false, familyMemberDraftName: undefined, familyMemberDraftRole: undefined }
  } catch {
    await sendText(state.phone, '❌ Não consegui processar a foto. Envie novamente ou digite *não*:')
    return { familyMemberPhotoInvalid: true }
  }
}
