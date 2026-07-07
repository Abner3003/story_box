import { interrupt } from '@langchain/langgraph'
import { sendButtons, sendText, downloadMedia } from '../../../lib/whatsapp.js'
import { extractVisualProfile } from '../../../lib/vision.js'
import { getSimulatedMedia, clearSimulatedMedia } from '../../../lib/simulate-media.js'
import { normalizeMediaForVision } from '../../../lib/media-frame.js'
import { createFamilyMember, saveFamilyMemberVisualProfile, uploadFamilyMemberPhoto } from '../onboarding.repository.js'
import { checkEditIntent } from '../edit-intent.js'
import { looksLikeStrayMediaMessage } from '../../../lib/message-tags.js'
import { FAMILY_DONE_BUTTON } from './collect-family-member-info.js'
import type { OnboardingState } from '../onboarding.state.js'

const IMAGE_ID_RE = /^\[image:(.+)\]$/

async function sendNextStepPrompt(phone: string, prefix?: string): Promise<void> {
  const lead = prefix ? `${prefix}\n\n` : ''
  await sendButtons(
    phone,
    `${lead}Quer cadastrar mais alguém? Me diz o *nome e quem é essa pessoa* (ex: "Ana, mamãe"), ou toque em "Terminei" pra seguir:`,
    [FAMILY_DONE_BUTTON],
  )
}

export async function collectFamilyMemberPhotoNode(state: OnboardingState): Promise<Partial<OnboardingState>> {
  const raw = interrupt<string>('awaiting_family_member_photo')

  const match = IMAGE_ID_RE.exec(raw)
  const name = state.familyMemberDraftName ?? 'essa pessoa'

  if (!match) {
    const edit = await checkEditIntent(raw, 'collect_family_member_photo')
    if (edit) return edit

    const trimmed = raw.trim()

    if (looksLikeStrayMediaMessage(trimmed)) {
      await sendText(
        state.phone,
        '❌ Não entendi. Manda a foto ou digite *não* pra pular:',
      )
      return { familyMemberPhotoInvalid: true }
    }

    if (!/^n(ão|ao)?$/i.test(trimmed) && trimmed !== FAMILY_DONE_BUTTON.id && trimmed !== FAMILY_DONE_BUTTON.title) {
      await sendText(state.phone, '❌ Não entendi. Manda a foto ou digite *não* pra pular:')
      return { familyMemberPhotoInvalid: true }
    }

    // Pulou a foto — ainda cadastra a pessoa só com nome/papel.
    if (state.subscriberId) {
      await createFamilyMember({ subscriber_id: state.subscriberId, name, role: state.familyMemberDraftRole })
    }
    await sendNextStepPrompt(state.phone)
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

    const normalized = base64 ? await normalizeMediaForVision(base64, mimeType) : { base64, mimeType, source: 'image' as const }

    if (state.subscriberId) {
      const memberId = await createFamilyMember({ subscriber_id: state.subscriberId, name, role: state.familyMemberDraftRole })

      if (normalized.base64) {
        const profile = await extractVisualProfile(normalized.base64, normalized.mimeType)
        const photoPath = await uploadFamilyMemberPhoto(memberId, normalized.base64, normalized.mimeType)
        await saveFamilyMemberVisualProfile(memberId, profile, photoPath)
      }
    }

    await sendNextStepPrompt(state.phone, `📸 ${name} cadastrado(a)!`)

    return { familyMemberPhotoInvalid: false, familyMemberDraftName: undefined, familyMemberDraftRole: undefined }
  } catch (err) {
    console.error('[onboarding] failed to process family member photo', {
      name,
      hasDraftRole: Boolean(state.familyMemberDraftRole),
      subscriberId: state.subscriberId,
      simulate: state.simulate,
      error: err,
    })
    await sendText(state.phone, '❌ Não consegui processar a foto. Envie novamente ou digite *não*:')
    return { familyMemberPhotoInvalid: true }
  }
}
