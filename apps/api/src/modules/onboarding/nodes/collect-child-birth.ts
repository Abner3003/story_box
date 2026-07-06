import { interrupt } from '@langchain/langgraph'
import { sendText } from '../../../lib/whatsapp.js'
import type { ChildInput, OnboardingState } from '../onboarding.state.js'
import { maxChildrenForPlan } from '../max-children.js'
import { checkEditIntent } from '../edit-intent.js'
import { createChild } from '../onboarding.repository.js'

function parseBirthDate(input: string): string | null {
  // aceita DD/MM/YYYY ou YYYY-MM-DD
  const parts = input.trim().split(/[\/\-]/)
  if (parts.length !== 3) return null
  const [a, b, c] = parts.map(Number)
  if ([a, b, c].some(isNaN)) return null

  let year: number, month: number, day: number
  if (String(parts[0]).length === 4) {
    ;[year, month, day] = [a, b, c]
  } else {
    ;[day, month, year] = [a, b, c]
  }

  if (year < 2000 || year > 2030 || month < 1 || month > 12 || day < 1 || day > 31) return null
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export async function collectChildBirthNode(state: OnboardingState): Promise<Partial<OnboardingState>> {
  const raw = interrupt<string>(`awaiting_child_birth_${state.children.length}`)

  const edit = await checkEditIntent(raw, 'collect_child_birth')
  if (edit) return edit

  const birthDate = parseBirthDate(raw)

  if (!birthDate) {
    await sendText(state.phone, '❌ Data inválida. Use o formato DD/MM/AAAA:')
    return { childBirthInvalid: true, editIntent: undefined }
  }

  const child: ChildInput = { name: state.childDraftName ?? '', birthDate }
  const children = [...state.children, child]
  const max = maxChildrenForPlan(state.plan)
  const childrenDone = children.length >= max

  // O consentimento de imagem já foi dado antes de chegar aqui — cadastra o
  // filho de verdade agora (em vez de só guardar em memória e criar tudo de
  // uma vez depois), pra já poder pedir a foto dele na sequência.
  let childId: string | undefined
  if (state.subscriberId) {
    childId = await createChild({
      subscriber_id: state.subscriberId,
      name: child.name,
      birth_date: child.birthDate,
      image_consent: state.imageConsentAccepted ?? false,
    })
  }
  const childIds = childId ? [...state.childIds, childId] : state.childIds

  await sendText(state.phone, `${child.name} cadastrado! ✅`)

  return { children, childIds, childBirthInvalid: false, childrenDone, editIntent: undefined }
}
