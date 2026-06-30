import { interrupt } from '@langchain/langgraph'
import { sendText } from '../../../lib/whatsapp.js'
import type { OnboardingState, AddressInput } from '../onboarding.state.js'

interface ViaCepResponse {
  erro?: boolean
  logradouro: string
  bairro: string
  localidade: string
  uf: string
}

async function fetchAddress(zip: string): Promise<ViaCepResponse | null> {
  const clean = zip.replace(/\D/g, '')
  if (clean.length !== 8) return null
  const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`)
  if (!res.ok) {
    console.log(`Failed to fetch address for zip ${zip}: ${res.status} ${res.statusText}`)
    return null
  }
  const data = await res.json() as ViaCepResponse
  return data.erro ? null : data
}

export async function collectAddressNode(state: OnboardingState): Promise<Partial<OnboardingState>> {
  await sendText(state.phone, 'Agora preciso do endereço para a entrega 📦\n\nQual é o seu *CEP*? (somente números, ex: 04756000)')

  let cep: ViaCepResponse | null = null
  let zip = ''

  while (!cep) {
    const raw = interrupt<string>('awaiting_zip')
    zip = raw.trim().replace(/[\.\-\s]/g, '')
    cep = await fetchAddress(zip)
    if (!cep) await sendText(state.phone, '❌ CEP não encontrado. Informe somente os números, ex: 04756000:')
  }

  await sendText(
    state.phone,
    `Encontrei! 📍 *${cep.logradouro}, ${cep.bairro} — ${cep.localidade}/${cep.uf}*\n\nQual o *número* do seu endereço?`,
  )

  const number = interrupt<string>('awaiting_number')

  await sendText(state.phone, 'Tem *complemento*? (apto, bloco...) Se não tiver, mande *não*:')
  const complementRaw = interrupt<string>('awaiting_complement')
  const complement = /^n(ão|ao)?$/i.test(complementRaw.trim()) ? undefined : complementRaw.trim()

  const address: AddressInput = {
    zip: zip.replace(/\D/g, ''),
    street: cep.logradouro,
    number: number.trim(),
    complement,
    neighborhood: cep.bairro,
    city: cep.localidade,
    state: cep.uf,
  }

  await sendText(state.phone, '✅ Endereço salvo!')

  return { address }
}
