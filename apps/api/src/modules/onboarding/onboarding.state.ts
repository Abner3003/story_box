import { Annotation } from '@langchain/langgraph'
import type { SubscriberPlan } from '@storybox/db'
import type { AbacatePayPlan } from '../billing/billing.models.js'

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

export interface AddressDraft {
  zip: string
  street: string
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
  abacatepayPlanId: Annotation<string | undefined>({
    reducer: (_, b) => b,
    default: () => undefined,
  }),
  abacatepayPlanName: Annotation<string | undefined>({
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

  // ── Intenção de alteração (edição de dados durante o onboarding) ──
  editIntent: Annotation<'plan' | 'address' | 'child' | undefined>({
    reducer: (_, b) => b,
    default: () => undefined,
  }),
  returnTo: Annotation<string | undefined>({
    reducer: (_, b) => b,
    default: () => undefined,
  }),

  // ── Tipo de compra (livro único vs assinatura) ────────────
  purchaseType: Annotation<'one_time' | 'subscription' | undefined>({
    reducer: (_, b) => b,
    default: () => undefined,
  }),
  purchaseTypeInvalid: Annotation<boolean>({
    reducer: (_, b) => b,
    default: () => false,
  }),

  // ── Escolha de plano ──────────────────────────────────────
  availablePlans: Annotation<AbacatePayPlan[]>({
    reducer: (_, b) => b,
    default: () => [],
  }),
  planChoiceInvalid: Annotation<boolean>({
    reducer: (_, b) => b,
    default: () => false,
  }),
  planIsRecurring: Annotation<boolean>({
    reducer: (_, b) => b,
    default: () => false,
  }),

  // ── Dados de cobrança ──────────────────────────────────────
  subscriberEmail: Annotation<string | undefined>({
    reducer: (_, b) => b,
    default: () => undefined,
  }),
  emailInvalid: Annotation<boolean>({
    reducer: (_, b) => b,
    default: () => false,
  }),
  subscriberCpf: Annotation<string | undefined>({
    reducer: (_, b) => b,
    default: () => undefined,
  }),
  cpfInvalid: Annotation<boolean>({
    reducer: (_, b) => b,
    default: () => false,
  }),

  // ── Pagamento ──────────────────────────────────────────────
  paymentLink: Annotation<string | undefined>({
    reducer: (_, b) => b,
    default: () => undefined,
  }),
  paymentConfirmed: Annotation<boolean>({
    reducer: (_, b) => b,
    default: () => false,
  }),

  // ── Endereço ───────────────────────────────────────────────
  addressDraft: Annotation<AddressDraft | undefined>({
    reducer: (_, b) => b,
    default: () => undefined,
  }),
  addressNumber: Annotation<string | undefined>({
    reducer: (_, b) => b,
    default: () => undefined,
  }),
  zipInvalid: Annotation<boolean>({
    reducer: (_, b) => b,
    default: () => false,
  }),

  // ── Filhos ─────────────────────────────────────────────────
  childDraftName: Annotation<string | undefined>({
    reducer: (_, b) => b,
    default: () => undefined,
  }),
  childBirthInvalid: Annotation<boolean>({
    reducer: (_, b) => b,
    default: () => false,
  }),
  childrenDone: Annotation<boolean>({
    reducer: (_, b) => b,
    default: () => false,
  }),
  featuredChildIndices: Annotation<number[]>({
    reducer: (_, b) => b,
    default: () => [],
  }),
  childSelectionInvalid: Annotation<boolean>({
    reducer: (_, b) => b,
    default: () => false,
  }),

  // ── Consentimento ────────────────────────────────────────────
  consentInvalid: Annotation<boolean>({
    reducer: (_, b) => b,
    default: () => false,
  }),

  // ── Foto ───────────────────────────────────────────────────
  photoInvalid: Annotation<boolean>({
    reducer: (_, b) => b,
    default: () => false,
  }),
  photoQueueIndex: Annotation<number>({
    reducer: (_, b) => b,
    default: () => 0,
  }),
  currentChildPhotoPath: Annotation<string | undefined>({
    reducer: (_, b) => b,
    default: () => undefined,
  }),

  // ── Estilo de ilustração ─────────────────────────────────────
  styleOptions: Annotation<Array<{ id: string; label: string }>>({
    reducer: (_, b) => b,
    default: () => [],
  }),
  styleChoiceInvalid: Annotation<boolean>({
    reducer: (_, b) => b,
    default: () => false,
  }),

  // ── História do mês ──────────────────────────────────────────
  storyMoment: Annotation<string | undefined>({
    reducer: (_, b) => b,
    default: () => undefined,
  }),
  momentPhotoPath: Annotation<string | undefined>({
    reducer: (_, b) => b,
    default: () => undefined,
  }),
  momentPhotoInvalid: Annotation<boolean>({
    reducer: (_, b) => b,
    default: () => false,
  }),
  storyChallenge: Annotation<string | undefined>({
    reducer: (_, b) => b,
    default: () => undefined,
  }),
  collectionIds: Annotation<string[]>({
    reducer: (_, b) => b,
    default: () => [],
  }),
  storyQueueIndex: Annotation<number>({
    reducer: (_, b) => b,
    default: () => 0,
  }),

  // ── Menu de conta (assinante já ativo, sem fluxo pendente) ────
  menuChoice: Annotation<'help' | 'address' | undefined>({
    reducer: (_, b) => b,
    default: () => undefined,
  }),
  menuChoiceInvalid: Annotation<boolean>({
    reducer: (_, b) => b,
    default: () => false,
  }),
})

export type OnboardingState = typeof OnboardingAnnotation.State
