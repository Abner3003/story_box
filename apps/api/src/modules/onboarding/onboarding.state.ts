import { Annotation } from '@langchain/langgraph'
import type { SubscriberPlan } from '@storybox/db'

export interface ChildInput {
  name: string
  birthDate: string // ISO date: "2022-03-15"
}

export interface AddressInput {
  zip: string
  street: string
  number: string
  complement?: string
  neighborhood: string
  city: string
  state: string
}

export const OnboardingAnnotation = Annotation.Root({
  phone: Annotation<string>(),
  subscriberName: Annotation<string>({
    reducer: (_, b) => b,
    default: () => '',
  }),
  plan: Annotation<SubscriberPlan | undefined>({
    reducer: (_, b) => b,
    default: () => undefined,
  }),
  subscriberId: Annotation<string | undefined>({
    reducer: (_, b) => b,
    default: () => undefined,
  }),
  children: Annotation<ChildInput[]>({
    reducer: (_, b) => b,
    default: () => [],
  }),
  address: Annotation<AddressInput | undefined>({
    reducer: (_, b) => b,
    default: () => undefined,
  }),
  imageConsentAccepted: Annotation<boolean | undefined>({
    reducer: (_, b) => b,
    default: () => undefined,
  }),
  childIds: Annotation<string[]>({
    reducer: (_, b) => b,
    default: () => [],
  }),
  simulate: Annotation<boolean>({
    reducer: (_, b) => b,
    default: () => false,
  }),
})

export type OnboardingState = typeof OnboardingAnnotation.State
