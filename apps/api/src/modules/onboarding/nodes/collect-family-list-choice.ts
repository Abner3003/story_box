import { interrupt } from '@langchain/langgraph'
import type { OnboardingState } from '../onboarding.state.js'

export async function collectFamilyListChoiceNode(state: OnboardingState): Promise<Partial<OnboardingState>> {
  const raw = interrupt<string>('awaiting_family_list_choice')
  const trimmed = raw.trim()

  return { familyListAddChosen: trimmed === 'family_add' || trimmed === '1' }
}
