import { interrupt } from '@langchain/langgraph'
import { sendButtons, sendText } from '../../../lib/whatsapp.js'
import { looksLikeStrayMediaMessage } from '../../../lib/message-tags.js'
import { checkEditIntent } from '../edit-intent.js'
import { findFamilyMemberBySubscriberAndValue } from '../onboarding.repository.js'
import type { OnboardingState } from '../onboarding.state.js'

export const FAMILY_DONE_BUTTON = { id: 'family_done', title: 'Terminei' }

// Espera "Nome, papel" (ex: "Ana, mamãe") — se só vier o nome, o papel fica
// em branco (não é obrigatório, só ajuda o prompt de ilustração).
function parseNameAndRole(raw: string): { name: string; role?: string } | null {
  const trimmed = raw.trim()
  if (!trimmed) return null

  const [namePart, rolePart] = trimmed.split(',').map((s) => s.trim())
  if (!namePart) return null

  return { name: namePart, role: rolePart || undefined }
}

function extractImageCaption(raw: string): string | null {
  const match = /^\[image:(.+?)\](?:\n\n([\s\S]+))?$/.exec(raw.trim())
  return match?.[2]?.trim() || null
}

function isImageOnly(raw: string): boolean {
  return /^\[image:(.+?)\]$/.test(raw.trim())
}

export async function collectFamilyMemberInfoNode(state: OnboardingState): Promise<Partial<OnboardingState>> {
  const raw = interrupt<string>('awaiting_family_member_info')
  const trimmed = raw.trim()

  if (looksLikeStrayMediaMessage(trimmed)) {
    await sendText(
      state.phone,
      '❌ Não entendi. Me manda o *nome e quem é essa pessoa* (ex: "Ana, mamãe"), ou toque em "Terminei" pra seguir:',
    )
    return { familyMemberInfoInvalid: true, familyMembersDone: false }
  }

  if (/^n(ão|ao)?$/i.test(trimmed) || trimmed === FAMILY_DONE_BUTTON.id || trimmed === FAMILY_DONE_BUTTON.title) {
    if (!state.familyMembersDone) {
      await sendText(state.phone, '✅ Combinado! Vamos seguir.')
    }
    return { familyMembersDone: true, familyMemberInfoInvalid: false, familyMemberPendingMedia: undefined, familyMemberExistingId: undefined }
  }

  const edit = await checkEditIntent(raw, 'collect_family_member_info')
  if (edit) return edit

  if (isImageOnly(raw)) {
    await sendText(
      state.phone,
      '❌ Recebi a foto, mas preciso também do nome ou papel junto. Mande algo como "Ana, mamãe" na legenda da imagem, ou toque em "Terminei" pra seguir:',
    )
    return { familyMemberInfoInvalid: true, familyMemberPendingMedia: undefined, familyMemberExistingId: undefined }
  }

  const imageCaption = extractImageCaption(raw)
  if (imageCaption) {
    const parsed = parseNameAndRole(imageCaption)
    if (!parsed) {
      await sendText(
        state.phone,
        '❌ Não entendi a legenda da foto. Me mande algo como "Ana, mamãe" junto com a imagem, ou toque em "Terminei" pra seguir:',
      )
      return { familyMemberInfoInvalid: true, familyMemberPendingMedia: undefined }
    }

    const existing = state.subscriberId
      ? await findFamilyMemberBySubscriberAndValue(state.subscriberId, parsed.role ?? parsed.name)
      : null

    return {
      familyMemberDraftName: parsed.name,
      familyMemberDraftRole: parsed.role,
      familyMemberExistingId: existing?.id,
      familyMemberPendingMedia: raw,
      familyMemberInfoInvalid: false,
      familyMembersDone: false,
    }
  }

  const parsed = parseNameAndRole(trimmed)
  if (!parsed) {
    await sendButtons(
      state.phone,
      '❌ Não entendi. Manda assim: *Nome, papel* (ex: "Ana, mamãe"), ou toque em "Terminei" pra seguir:',
      [FAMILY_DONE_BUTTON],
    )
    return { familyMemberInfoInvalid: true }
  }

  const existing = state.subscriberId
    ? await findFamilyMemberBySubscriberAndValue(state.subscriberId, parsed.role ?? parsed.name)
    : null

  await sendText(state.phone, `📸 Agora me manda uma foto de *${parsed.name}*!`)

  return {
    familyMemberDraftName: parsed.name,
    familyMemberDraftRole: parsed.role,
    familyMemberExistingId: existing?.id,
    familyMemberInfoInvalid: false,
    familyMembersDone: false,
    familyMemberPendingMedia: undefined,
  }
}
