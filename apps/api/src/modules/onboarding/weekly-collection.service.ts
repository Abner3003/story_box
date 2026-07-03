import { Command } from '@langchain/langgraph'
import type { Subscriber } from '@storybox/db'
import { weeklyCollectionGraph } from './weekly-collection.graph.js'
import { getChildrenForSubscriber, currentWeekStart } from './onboarding.repository.js'
import { findSubscriberByPhone } from '../payment/payment.repository.js'

function threadConfig(subscriberId: string, weekStart: string) {
  return { configurable: { thread_id: `weekly:${subscriberId}:${weekStart}` } }
}

export async function startWeeklyCollection(subscriber: Subscriber): Promise<void> {
  const weekStart = currentWeekStart()
  const config = threadConfig(subscriber.id, weekStart)

  const children = (await getChildrenForSubscriber(subscriber.id)).filter((child) => child.image_consent)
  if (!children.length) return

  const initialState = {
    phone: subscriber.phone,
    subscriberId: subscriber.id,
    children: children.map((child) => ({ name: child.name, birthDate: child.birth_date })),
    childIds: children.map((child) => child.id),
  }

  for await (const _ of await weeklyCollectionGraph.stream(initialState, config)) { /* drain */ }
}

export async function resumeWeeklyCollection(phone: string, message: string): Promise<void> {
  const subscriber = await findSubscriberByPhone(phone)
  if (!subscriber) return

  const weekStart = currentWeekStart()
  const config = threadConfig(subscriber.id, weekStart)

  for await (const _ of await weeklyCollectionGraph.stream(new Command({ resume: message }), config)) { /* drain */ }
}

export async function isInWeeklyCollection(phone: string): Promise<boolean> {
  const subscriber = await findSubscriberByPhone(phone)
  if (!subscriber) return false

  const weekStart = currentWeekStart()
  const config = threadConfig(subscriber.id, weekStart)

  const state = await weeklyCollectionGraph.getState(config)
  return state.tasks.length > 0
}
