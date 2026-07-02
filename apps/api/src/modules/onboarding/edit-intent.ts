import { detectEditIntent } from '../../lib/intent.js'
import type { OnboardingState } from './onboarding.state.js'

const ADDRESS_CHAIN_NODES = new Set(['collect_zip', 'collect_number', 'collect_complement'])

export async function checkEditIntent(raw: string, currentNode: string): Promise<Partial<OnboardingState> | null> {
  const intent = await detectEditIntent(raw)
  if (!intent) return null

  if (intent === 'address' && !ADDRESS_CHAIN_NODES.has(currentNode)) {
    return { editIntent: intent, returnTo: currentNode }
  }

  return { editIntent: intent, returnTo: undefined }
}
