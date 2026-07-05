import { Command } from '@langchain/langgraph'
import type { Subscriber } from '@storybox/db'
import { accountGraph } from './account.graph.js'
import { findSubscriberByPhone } from '../payment/payment.repository.js'

function threadConfig(subscriberId: string) {
  return { configurable: { thread_id: `account:${subscriberId}` } }
}

export async function startAccountMenu(subscriber: Subscriber): Promise<void> {
  const config = threadConfig(subscriber.id)
  const initialState = {
    phone: subscriber.phone,
    subscriberId: subscriber.id,
    subscriberName: subscriber.full_name,
  }
  for await (const _ of await accountGraph.stream(initialState, config)) { /* drain */ }
}

export async function resumeAccountMenu(phone: string, message: string): Promise<void> {
  const subscriber = await findSubscriberByPhone(phone)
  if (!subscriber) return

  const config = threadConfig(subscriber.id)
  for await (const _ of await accountGraph.stream(new Command({ resume: message }), config)) { /* drain */ }
}

export async function isInAccountMenu(phone: string): Promise<boolean> {
  const subscriber = await findSubscriberByPhone(phone)
  if (!subscriber) return false

  const config = threadConfig(subscriber.id)
  const state = await accountGraph.getState(config)
  return state.tasks.length > 0
}
