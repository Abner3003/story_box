import { sendTemplate } from '../../../lib/whatsapp.js'
import type { OnboardingState } from '../onboarding.state.js'

const TEMPLATE_NAME = process.env.WHATSAPP_WEEKLY_TEMPLATE_NAME

export async function askWeeklyKickoffNode(state: OnboardingState): Promise<Partial<OnboardingState>> {
  if (!TEMPLATE_NAME) {
    throw new Error('WHATSAPP_WEEKLY_TEMPLATE_NAME não configurado — cadastre e aprove o template no WhatsApp Manager')
  }

  await sendTemplate(state.phone, TEMPLATE_NAME)

  return {}
}
