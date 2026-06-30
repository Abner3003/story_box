import { interrupt } from '@langchain/langgraph'
import { sendText } from '../../../lib/whatsapp.js'
import type { OnboardingState, ChildInput } from '../onboarding.state.js'

const MAX_CHILDREN: Record<string, number> = { digital: 1, box: 1, family: 3 }

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

export async function collectChildrenNode(state: OnboardingState): Promise<Partial<OnboardingState>> {
  const max = MAX_CHILDREN[state.plan ?? 'digital']
  const children: ChildInput[] = []

  await sendText(
    state.phone,
    `Agora vou conhecer seu(s) filho(s)! 👶\n\nQual o *nome* do ${children.length + 1}º filho?`,
  )

  while (children.length < max) {
    const name = interrupt<string>(`awaiting_child_name_${children.length}`)

    await sendText(state.phone, `Que nome lindo! 💛\n\nQual a *data de nascimento* de ${name.trim()}? (DD/MM/AAAA)`)

    let birthDate: string | null = null
    while (!birthDate) {
      const raw = interrupt<string>(`awaiting_child_birth_${children.length}`)
      birthDate = parseBirthDate(raw)
      if (!birthDate) await sendText(state.phone, '❌ Data inválida. Use o formato DD/MM/AAAA:')
    }

    children.push({ name: name.trim(), birthDate })

    if (children.length < max) {
      await sendText(
        state.phone,
        `${name.trim()} cadastrado! ✅\n\nQuer adicionar outro filho? (${children.length}/${max})\nMande o *nome* ou *não* para continuar:`,
      )
      const next = interrupt<string>(`awaiting_more_children_${children.length}`)
      if (/^n(ão|ao)?$/i.test(next.trim())) break
      // se mandou um nome, usa direto na próxima iteração sem pedir de novo
      children.push({ name: next.trim(), birthDate: '' }) // placeholder; loop pedirá a data
      children.pop() // descarta — o loop vai pedir nome novamente não; vamos tratar como nome
      // Simplificação: considera a resposta como o nome do próximo filho
      const nextName = next.trim()
      await sendText(state.phone, `Qual a *data de nascimento* de ${nextName}? (DD/MM/AAAA)`)
      let nextDate: string | null = null
      while (!nextDate) {
        const raw = interrupt<string>(`awaiting_child_birth_extra_${children.length}`)
        nextDate = parseBirthDate(raw)
        if (!nextDate) await sendText(state.phone, '❌ Data inválida. Use o formato DD/MM/AAAA:')
      }
      children.push({ name: nextName, birthDate: nextDate })
    }
  }

  await sendText(state.phone, `✅ ${children.length} filho(s) cadastrado(s)!`)

  return { children }
}
