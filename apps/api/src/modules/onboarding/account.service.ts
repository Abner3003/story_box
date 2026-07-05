import { Command } from '@langchain/langgraph'
import type { Subscriber } from '@storybox/db'
import { accountGraph } from './account.graph.js'
import { findSubscriberByPhone } from '../payment/payment.repository.js'
import { getChildrenForSubscriber } from './onboarding.repository.js'

function threadConfig(subscriberId: string) {
  return { configurable: { thread_id: `account:${subscriberId}` } }
}

export async function startAccountMenu(subscriber: Subscriber): Promise<void> {
  const config = threadConfig(subscriber.id)

  // Já vem pronto pra "gerar outro livro" sem pedir de novo o que já está
  // salvo (e-mail, CPF, filhos com consentimento de imagem).
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
