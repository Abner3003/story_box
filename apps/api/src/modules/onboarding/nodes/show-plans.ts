import { sendText, sendImage } from '../../../lib/whatsapp.js'
import type { OnboardingState } from '../onboarding.state.js'
import { getPlans, formatPlanAmount } from '../../billing/billing.service.js'

const INTER_MESSAGE_DELAY_MS = 1200

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function formatOptionsList(count: number): string {
  const numbers = Array.from({ length: count }, (_, i) => `*${i + 1}*`)
  if (numbers.length === 1) return numbers[0]
  return `${numbers.slice(0, -1).join(', ')} ou ${numbers[numbers.length - 1]}`
}

export async function showPlansNode(state: OnboardingState): Promise<Partial<OnboardingState>> {
  const wantsRecurring = state.purchaseType === 'subscription'
  const plans = (await getPlans()).filter((plan) => plan.isRecurring === wantsRecurring)

  if (!plans.length) {
    throw new Error(
      `Nenhum plano ${wantsRecurring ? 'de assinatura' : 'avulso'} cadastrado na AbacatePay. Verifique a configuração da sua conta.`,
    )
  }

  for (const [index, plan] of plans.entries()) {
    const amount = formatPlanAmount(plan.amount)
    const priceLine = plan.isRecurring ? `${amount}/${plan.interval}` : `${amount} (pagamento único)`
    const isFirst = index === 0
    const isLast = index === plans.length - 1

    const parts = [
      isFirst ? 'Escolha o plano ideal para você 👇\n' : undefined,
      `*${index + 1}. ${plan.name}* — ${priceLine}`,
      isLast ? `\nDigite ${formatOptionsList(plans.length)} para escolher o plano:` : undefined,
    ]
    const caption = parts.filter(Boolean).join('\n\n')

    if (plan.imageUrl) {
      await sendImage(state.phone, plan.imageUrl, caption)
    } else {
      await sendText(state.phone, caption)
    }

    if (!isLast) await sleep(INTER_MESSAGE_DELAY_MS)
  }

  return { availablePlans: plans, planChoiceInvalid: false, editIntent: undefined }
}
