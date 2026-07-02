import { interrupt } from '@langchain/langgraph'
import { sendText } from '../../../lib/whatsapp.js'
import { checkEditIntent } from '../edit-intent.js'
import type { OnboardingState } from '../onboarding.state.js'

function parseSelection(raw: string, total: number): number[] | null {
  const trimmed = raw.trim()

  if (/^todos?$/i.test(trimmed)) {
    return Array.from({ length: total }, (_, i) => i)
  }

  const parts = trimmed.split(/[,\s]+/).filter(Boolean)
  if (!parts.length) return null

  const indices = new Set<number>()
  for (const part of parts) {
    const n = Number.parseInt(part, 10) - 1
    if (Number.isNaN(n) || n < 0 || n >= total) return null
    indices.add(n)
  }

  return [...indices].sort((a, b) => a - b)
}

export async function collectChildSelectionNode(state: OnboardingState): Promise<Partial<OnboardingState>> {
  const choice = interrupt<string>('awaiting_child_selection')

  const edit = await checkEditIntent(choice, 'collect_child_selection')
  if (edit) return edit

  const indices = parseSelection(choice, state.children.length)

  if (!indices) {
    await sendText(
      state.phone,
      `❌ Opção inválida. Digite os números separados por vírgula (ex: 1,3) ou *todos*, usando números de *1* a *${state.children.length}*:`,
    )
    return { childSelectionInvalid: true, editIntent: undefined }
  }

  return { featuredChildIndices: indices, childSelectionInvalid: false, editIntent: undefined }
}
