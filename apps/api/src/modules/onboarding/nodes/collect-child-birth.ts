import { interrupt } from '@langchain/langgraph'
import { sendText } from '../../../lib/whatsapp.js'
import type { ChildInput, OnboardingState } from '../onboarding.state.js'
import { maxChildrenForPlan } from '../max-children.js'
import { checkEditIntent } from '../edit-intent.js'

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

  if (children.length < max) {
    await sendText(
      state.phone,
      `${child.name} cadastrado! ✅\n\nQuer adicionar outro filho? (${children.length}/${max})\nMande o *nome* ou *não* para continuar:`,
    )
    return { children, childBirthInvalid: false, childrenDone: false, editIntent: undefined }
  }

  await sendText(state.phone, `✅ ${children.length} filho(s) cadastrado(s)!`)
  return { children, childBirthInvalid: false, childrenDone: true, editIntent: undefined }
}
