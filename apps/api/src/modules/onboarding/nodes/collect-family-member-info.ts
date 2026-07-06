import { interrupt } from '@langchain/langgraph'
import { sendText } from '../../../lib/whatsapp.js'
import { checkEditIntent } from '../edit-intent.js'
import type { OnboardingState } from '../onboarding.state.js'

// Espera "Nome, papel" (ex: "Ana, mamãe") — se só vier o nome, o papel fica
// em branco (não é obrigatório, só ajuda o prompt de ilustração).
function parseNameAndRole(raw: string): { name: string; role?: string } | null {
  const trimmed = raw.trim()
  if (!trimmed) return null

  const [namePart, rolePart] = trimmed.split(',').map((s) => s.trim())
  if (!namePart) return null

  return { name: namePart, role: rolePart || undefined }
}

export async function collectFamilyMemberInfoNode(state: OnboardingState): Promise<Partial<OnboardingState>> {
  const raw = interrupt<string>('awaiting_family_member_info')
  const trimmed = raw.trim()

  if (/^n(ão|ao)?$/i.test(trimmed)) {
    if (!state.familyMembersDone) {
      await sendText(state.phone, '✅ Combinado! Vamos seguir.')
    }
    return { familyMembersDone: true, familyMemberInfoInvalid: false }
  }

  const edit = await checkEditIntent(raw, 'collect_family_member_info')
  if (edit) return edit

  const parsed = parseNameAndRole(trimmed)
  if (!parsed) {
    await sendText(state.phone, '❌ Não entendi. Manda assim: *Nome, papel* (ex: "Ana, mamãe"), ou digite *não* pra pular:')
    return { familyMemberInfoInvalid: true }
  }

  await sendText(state.phone, `📸 Agora me manda uma foto de *${parsed.name}*!`)

  return {
    familyMemberDraftName: parsed.name,
    familyMemberDraftRole: parsed.role,
    familyMemberInfoInvalid: false,
    familyMembersDone: false,
  }
}
