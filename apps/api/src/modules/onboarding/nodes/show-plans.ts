import { sendText, sendImage } from '../../../lib/whatsapp.js'
import type { OnboardingState } from '../onboarding.state.js'
import { getPlans, formatPlanAmount } from '../../billing/billing.service.js'

export function formatOptionsList(count: number): string {
  const numbers = Array.from({ length: count }, (_, i) => `*${i + 1}*`)
  if (numbers.length === 1) return numbers[0]
  return `${numbers.slice(0, -1).join(', ')} ou ${numbers[numbers.length - 1]}`
}

export async function showPlansNode(state: OnboardingState): Promise<Partial<OnboardingState>> {
  const plans = await getPlans()

  if (!plans.length) {
    throw new Error('Nenhum plano retornado pelo gateway de pagamento. Verifique a configuração da sua conta.')
  }

  await sendText(state.phone, 'Escolha o plano ideal para você 👇')

  for (const [index, plan] of plans.entries()) {
    const amount = formatPlanAmount(plan.amount)
    const caption = [`*${index + 1}. ${plan.name}* — ${amount}/${plan.interval}`, plan.description]
      .filter(Boolean)
      .join('\n\n')

    if (plan.imageUrl) {
      await sendImage(state.phone, plan.imageUrl, caption)
    } else {
      await sendText(state.phone, caption)
    }
  }

  await sendText(state.phone, `Digite ${formatOptionsList(plans.length)} para escolher o plano:`)

  return { availablePlans: plans, planChoiceInvalid: false, editIntent: undefined }
}
