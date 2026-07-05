import { Command } from '@langchain/langgraph'
import type { Subscriber } from '@storybox/db'
import { upsellGraph } from './upsell.graph.js'
import { getChildrenForSubscriber } from './onboarding.repository.js'
import { findSubscriberByPhone } from '../payment/payment.repository.js'

function threadConfig(subscriberId: string) {
  return { configurable: { thread_id: `upsell:${subscriberId}` } }
}

export async function startUpsell(subscriber: Subscriber): Promise<void> {
  const config = threadConfig(subscriber.id)

  const children = (await getChildrenForSubscriber(subscriber.id)).filter((child) => child.image_consent)

  const initialState = {
    phone: subscriber.phone,
    subscriberId: subscriber.id,
    subscriberName: subscriber.full_name,
    subscriberEmail: subscriber.email,
    subscriberCpf: subscriber.cpf,
    children: children.map((child) => ({ name: child.name, birthDate: child.birth_date })),
    childIds: children.map((child) => child.id),
  }
  for await (const _ of await upsellGraph.stream(initialState, config)) { /* drain */ }
}

export async function resumeUpsell(phone: string, message: string): Promise<void> {
  const subscriber = await findSubscriberByPhone(phone)
  if (!subscriber) return

  const config = threadConfig(subscriber.id)
  for await (const _ of await upsellGraph.stream(new Command({ resume: message }), config)) { /* drain */ }
}

export async function isInUpsell(phone: string): Promise<boolean> {
  const subscriber = await findSubscriberByPhone(phone)
  if (!subscriber) return false

  const config = threadConfig(subscriber.id)
  const state = await upsellGraph.getState(config)
  return state.tasks.length > 0
}
