import { interrupt } from '@langchain/langgraph'
import { sendText } from '../../../lib/whatsapp.js'
import { saveFamilyAppearance } from '../onboarding.repository.js'
import type { OnboardingState } from '../onboarding.state.js'

const MALE_HINT_RE = /\b(irmão|filho|menino|neto|sobrinho|primo|garoto)\b/i
const FEMALE_HINT_RE = /\b(irmã|filha|menina|neta|sobrinha|prima|garota)\b/i
const SIBLING_RE = /\b(irmã[oa]?)\b/i

function inferGenderHint(text: string): string | null {
  if (MALE_HINT_RE.test(text)) return 'male'
  if (FEMALE_HINT_RE.test(text)) return 'female'
  return null
}

// Só é alcançado quando collect-family-photo.ts identificou alguém na foto
// sem saber o papel/gênero — pergunta separada num node próprio (em vez de
// um segundo interrupt() dentro do mesmo node) porque o LangGraph reexecuta
// a função do zero a cada resume: um segundo interrupt no mesmo node faria
// o upload/análise de visão rodar de novo (e cobrar da OpenAI de novo).
export async function collectFamilyClarificationNode(state: OnboardingState): Promise<Partial<OnboardingState>> {
  const clarification = interrupt<string>('awaiting_family_clarification')
  const trimmed = clarification.trim()

  // Confirmou um dos irmãos já cadastrados sugeridos na pergunta — já temos
  // nome e data de nascimento, não precisa perguntar de novo.
  const candidates = state.familyClarificationCandidates ?? []
  const matchedCandidate = candidates.find((name) => new RegExp(`\\b${name}\\b`, 'i').test(trimmed))
    ?? (candidates.length === 1 && /^(sim|isso|é|claro|exato|correto)$/i.test(trimmed) ? candidates[0] : null)

  if (matchedCandidate) {
    const description = [
      state.familyDescriptionPending,
      `Additional family member — this is ${matchedCandidate}, a sibling already known to the family.`,
    ].filter(Boolean).join('\n')

    if (state.subscriberId && state.familyPhotoPathPending) {
      await saveFamilyAppearance(state.subscriberId, state.familyPhotoPathPending, description)
    }

    await sendText(state.phone, `Anotado! *${matchedCandidate}* também vai aparecer nas ilustrações. 💛`)

    return {
      familyUnclearNote: undefined,
      familyPhotoPathPending: undefined,
      familyDescriptionPending: undefined,
      familyClarificationCandidates: [],
    }
  }

  const genderHint = inferGenderHint(trimmed)
  const genderLine = genderHint ? `a ${genderHint} child` : 'a child'
  const description = [
    state.familyDescriptionPending,
    `Additional family member — ${genderLine}, as described by the parent: "${trimmed}".`,
  ].filter(Boolean).join('\n')

  // É irmão(ã) — cadastra como filho de verdade (nome + data de nascimento),
  // não só a descrição visual pra ilustração.
  if (SIBLING_RE.test(trimmed)) {
    await sendText(
      state.phone,
      'Entendi, é irmão(ã)! Pra cadastrar, me manda o *nome* e a *data de nascimento* assim: Lucas, 15/03/2023',
    )
    return { familyDescriptionPending: description, familySiblingPending: true, familyClarificationCandidates: [] }
  }

  if (state.subscriberId && state.familyPhotoPathPending) {
    await saveFamilyAppearance(state.subscriberId, state.familyPhotoPathPending, description)
  }

  await sendText(state.phone, 'Anotado! Vou usar pra deixar as ilustrações mais especiais.')

  return {
    familyUnclearNote: undefined,
    familyPhotoPathPending: undefined,
    familyDescriptionPending: undefined,
    familyClarificationCandidates: [],
  }
}
