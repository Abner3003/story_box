import { interrupt } from '@langchain/langgraph'
import { sendText } from '../../../lib/whatsapp.js'
import type { OnboardingState } from '../onboarding.state.js'
import type { SubscriberPlan } from '@storybox/db'

const PLANS_MESSAGE = `Escolha o plano ideal para você 👇

1️⃣ *Digital* — R$ 29/mês
   📱 Livro em PDF entregue pelo WhatsApp

2️⃣ *Box* — R$ 79/mês
   📦 Livro impresso + brinde surpresa entregue em casa

3️⃣ *Family* — R$ 129/mês
   👨‍👩‍👧‍👦 Até 3 filhos, livros impressos + brindes

Digite *1*, *2* ou *3* para escolher:`

const planMap: Record<string, SubscriberPlan> = {
  '1': 'digital',
  '2': 'box',
  '3': 'family',
}

export async function showPlansNode(state: OnboardingState): Promise<Partial<OnboardingState>> {
  await sendText(state.phone, PLANS_MESSAGE)

  while (true) {
    const choice = interrupt<string>('awaiting_plan_choice')
    const plan = planMap[choice.trim()]

    if (plan) return { plan }

    await sendText(state.phone, '❌ Opção inválida. Digite *1*, *2* ou *3*:')
  }
}
