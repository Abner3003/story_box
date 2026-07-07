import { sendButtons } from '../../../lib/whatsapp.js'
import { getChildrenForSubscriber, getFamilyMembersForSubscriber } from '../onboarding.repository.js'
import type { OnboardingState } from '../onboarding.state.js'
import type { VisualProfile } from '@storybox/db'

function describe(name: string, roleOrAge?: string, profile?: VisualProfile | null): string {
  const traits = [profile?.hair, profile?.eyes].filter(Boolean).join(', ')
  const label = roleOrAge ? `${name} (${roleOrAge})` : name
  return traits ? `${label} — ${traits}` : label
}

export async function listFamilyMembersNode(state: OnboardingState): Promise<Partial<OnboardingState>> {
  if (!state.subscriberId) return {}

  const [children, familyMembers] = await Promise.all([
    getChildrenForSubscriber(state.subscriberId),
    getFamilyMembersForSubscriber(state.subscriberId),
  ])

  const lines = [
    ...children.map((c) => describe(c.name, undefined, c.visual_profile)),
    ...familyMembers.map((m) => describe(m.name, m.role, m.visual_profile)),
  ]

  const listText = lines.length
    ? `👨‍👩‍👧‍👦 Quem já está cadastrado:\n\n${lines.map((l) => `• ${l}`).join('\n')}`
    : 'Você ainda não cadastrou ninguém da família além das crianças.'

  await sendButtons(state.phone, `${listText}\n\nQuer cadastrar mais alguém?`, [
    { id: 'family_add', title: 'Adicionar pessoa' },
    { id: 'family_back', title: 'Voltar' },
  ])

  return {}
}
