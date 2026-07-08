import { interrupt } from '@langchain/langgraph'
import { sendButtons, sendText, downloadMedia } from '../../../lib/whatsapp.js'
import { extractVisualProfile } from '../../../lib/vision.js'
import { getSimulatedMedia, clearSimulatedMedia } from '../../../lib/simulate-media.js'
import { normalizeMediaForVision } from '../../../lib/media-frame.js'
import {
  createFamilyMember,
  findFamilyMemberBySubscriberAndValue,
  updateFamilyMemberPhoto,
} from '../onboarding.repository.js'
import { checkEditIntent } from '../edit-intent.js'
import { looksLikeStrayMediaMessage } from '../../../lib/message-tags.js'
import { FAMILY_DONE_BUTTON } from './collect-family-member-info.js'
import type { OnboardingState } from '../onboarding.state.js'

const IMAGE_ID_RE = /^\[image:(.+?)\](?:\n\n([\s\S]+))?$/

function parseNameAndRole(raw: string): { name: string; role?: string } | null {
  const trimmed = raw.trim()
  if (!trimmed) return null

  const [namePart, rolePart] = trimmed.split(',').map((s) => s.trim())
  if (!namePart) return null

  return { name: namePart, role: rolePart || undefined }
}

function extractImageCaption(raw: string): string | null {
  const match = IMAGE_ID_RE.exec(raw.trim())
  return match?.[2]?.trim() || null
}

async function sendNextStepPrompt(phone: string, prefix?: string): Promise<void> {
  const lead = prefix ? `${prefix}\n\n` : ''
  await sendButtons(
    phone,
    `${lead}Quer cadastrar mais alguém? Me diz o *nome e quem é essa pessoa* (ex: "Ana, mamãe"), ou toque em "Terminei" pra seguir:`,
    [FAMILY_DONE_BUTTON],
  )
}

export async function collectFamilyMemberPhotoNode(state: OnboardingState): Promise<Partial<OnboardingState>> {
  const raw = state.familyMemberPendingMedia ?? interrupt<string>('awaiting_family_member_photo')
  const match = IMAGE_ID_RE.exec(raw)
  const caption = extractImageCaption(raw)
  const parsedCaption = caption ? parseNameAndRole(caption) : null
  const name = state.familyMemberDraftName ?? parsedCaption?.name ?? parsedCaption?.role ?? 'essa pessoa'
  const role = state.familyMemberDraftRole ?? parsedCaption?.role
  const existingId = state.familyMemberExistingId ?? (
    state.subscriberId ? (await findFamilyMemberBySubscriberAndValue(state.subscriberId, role ?? name))?.id : undefined
  )

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
    if (state.subscriberId && !existingId) {
      await createFamilyMember({ subscriber_id: state.subscriberId, name, role })
    }
    await sendNextStepPrompt(state.phone)
    return {
      familyMemberPhotoInvalid: false,
      familyMemberDraftName: undefined,
      familyMemberDraftRole: undefined,
      familyMemberExistingId: undefined,
      familyMemberPendingMedia: undefined,
    }
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

    let memberId = existingId

    if (!memberId && state.subscriberId) {
      memberId = await createFamilyMember({ subscriber_id: state.subscriberId, name, role })
    }

    if (memberId && normalized.base64) {
      const profile = await extractVisualProfile(normalized.base64, normalized.mimeType)
      await updateFamilyMemberPhoto(memberId, normalized.base64, normalized.mimeType, profile)
    }

    await sendNextStepPrompt(state.phone, `📸 ${name} cadastrado(a)!`)

    return {
      familyMemberPhotoInvalid: false,
      familyMemberDraftName: undefined,
      familyMemberDraftRole: undefined,
      familyMemberExistingId: undefined,
      familyMemberPendingMedia: undefined,
    }
  } catch (err) {
    console.error('[onboarding] failed to process family member photo', {
      name,
      hasDraftRole: Boolean(role),
      subscriberId: state.subscriberId,
      simulate: state.simulate,
      error: err,
    })
    await sendText(state.phone, '❌ Não consegui processar a foto. Envie novamente ou digite *não*:')
    return { familyMemberPhotoInvalid: true }
  }
}
