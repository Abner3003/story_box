import { Command } from '@langchain/langgraph'
import { onboardingGraph } from './onboarding.graph.js'

function threadConfig(phone: string, simulate = false) {
  const prefix = simulate ? 'simulate' : 'onboarding'
  return { configurable: { thread_id: `${prefix}:${phone}` } }
}

export async function startOnboarding(phone: string, opts: { simulate?: boolean; name?: string } = {}): Promise<void> {
  const simulate = opts.simulate ?? false
  const config = threadConfig(phone, simulate)
  for await (const _ of await onboardingGraph.stream({ phone, simulate, subscriberName: opts.name ?? '' }, config)) { /* drain */ }
}

export async function resumeOnboarding(phone: string, message: string, opts: { simulate?: boolean } = {}): Promise<void> {
  const config = threadConfig(phone, opts.simulate ?? false)
  for await (const _ of await onboardingGraph.stream(new Command({ resume: message }), config)) { /* drain */ }
}

export async function isOnboarding(phone: string, opts: { simulate?: boolean } = {}): Promise<boolean> {
  const config = threadConfig(phone, opts.simulate ?? false)
  const state = await onboardingGraph.getState(config)
  return state.tasks.length > 0
}
