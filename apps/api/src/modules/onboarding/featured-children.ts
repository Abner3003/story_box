import type { OnboardingState } from './onboarding.state.js'

export function featuredChildNames(state: OnboardingState): string[] {
  return state.featuredChildIndices
    .map((i) => state.children[i]?.name)
    .filter((name): name is string => Boolean(name))
}

export function formatChildNameList(names: string[]): string {
  if (names.length === 0) return 'seu filho'
  if (names.length === 1) return names[0]
  return `${names.slice(0, -1).join(', ')} e ${names[names.length - 1]}`
}
