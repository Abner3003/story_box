import { interrupt } from '@langchain/langgraph'
import { sendButtons, sendText } from '../../../lib/whatsapp.js'
import type { OnboardingState } from '../onboarding.state.js'
import { upsertSubscriber } from '../onboarding.repository.js'
import { formatOptionsList, buildPlanButtons } from './show-plans.js'
import { looksLikeStrayMediaMessage } from '../../../lib/message-tags.js'

const MAX_NATIVE_BUTTONS = 3

function parsePlanChoice(raw: string): number {
  const buttonMatch = /^plan_choice_(\d+)$/.exec(raw)
  if (buttonMatch) return Number.parseInt(buttonMatch[1], 10)
  return Number.parseInt(raw, 10) - 1
}

export async function collectPlanChoiceNode(state: OnboardingState): Promise<Partial<OnboardingState>> {
  const choice = interrupt<string>('awaiting_plan_choice')
  const trimmed = choice.trim()

  if (looksLikeStrayMediaMessage(trimmed)) {
    return { planChoiceInvalid: true }
  }

  const index = parsePlanChoice(trimmed)
  const selectedPlan = state.availablePlans[index]

  if (!selectedPlan) {
    await sendText(state.phone, `❌ Opção inválida. Escolha ${formatOptionsList(state.availablePlans.length)}:`)
    if (state.availablePlans.length <= MAX_NATIVE_BUTTONS) {
      await sendButtons(state.phone, 'Escolha uma opção:', buildPlanButtons(state.availablePlans.length))
    }
    return { planChoiceInvalid: true }
  }

  // Assinante já existe (ex: comprando outro livro pelo menu de conta) — não
  // sobrescreve plan/is_recurring/status da assinatura principal, só usa o
  // plano escolhido pra este pagamento pontual. E-mail/CPF já estão salvos,
  // não precisa pedir de novo.
  if (state.subscriberId) {
    return {
      plan: selectedPlan.name,
      abacatepayPlanId: selectedPlan.id,
      abacatepayPlanName: selectedPlan.name,
      planIsRecurring: selectedPlan.isRecurring,
      planChoiceInvalid: false,
    }
  }

  const subscriberId = await upsertSubscriber({
    phone: state.phone,
    plan: selectedPlan.name,
    full_name: state.subscriberName || state.phone,
    abacatepay_plan_id: selectedPlan.id,
    is_recurring: selectedPlan.isRecurring,
    status: 'pending_payment',
  })

  await sendText(state.phone, 'Antes de gerar o pagamento, preciso do seu *e-mail*:')

  return {
    plan: selectedPlan.name,
    subscriberId,
    abacatepayPlanId: selectedPlan.id,
    abacatepayPlanName: selectedPlan.name,
    planIsRecurring: selectedPlan.isRecurring,
    planChoiceInvalid: false,
  }
}
