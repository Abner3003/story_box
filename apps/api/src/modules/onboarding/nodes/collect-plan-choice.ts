import { interrupt } from '@langchain/langgraph'
import { sendText } from '../../../lib/whatsapp.js'
import type { OnboardingState } from '../onboarding.state.js'
import { upsertSubscriber } from '../onboarding.repository.js'
import { formatOptionsList } from './show-plans.js'

export async function collectPlanChoiceNode(state: OnboardingState): Promise<Partial<OnboardingState>> {
  const choice = interrupt<string>('awaiting_plan_choice')
  const index = Number.parseInt(choice.trim(), 10) - 1
  const selectedPlan = state.availablePlans[index]

  if (!selectedPlan) {
    await sendText(state.phone, `❌ Opção inválida. Digite ${formatOptionsList(state.availablePlans.length)}:`)
    return { planChoiceInvalid: true }
  }

  const subscriberId = await upsertSubscriber({
    phone: state.phone,
    plan: selectedPlan.name,
    full_name: state.subscriberName || state.phone,
    abacatepay_plan_id: selectedPlan.id,
    status: 'pending_payment',
  })

  return {
    plan: selectedPlan.name,
    subscriberId,
    abacatepayPlanId: selectedPlan.id,
    abacatepayPlanName: selectedPlan.name,
    planChoiceInvalid: false,
  }
}
