import { interrupt } from '@langchain/langgraph'
import { sendText } from '../../../lib/whatsapp.js'
import { checkEditIntent } from '../edit-intent.js'
import type { OnboardingState } from '../onboarding.state.js'

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
  if (!res.ok) return null
  const data = await res.json() as ViaCepResponse
  return data.erro ? null : data
}

export async function collectZipNode(state: OnboardingState): Promise<Partial<OnboardingState>> {
  const raw = interrupt<string>('awaiting_zip')

  const edit = await checkEditIntent(raw, 'collect_zip')
  if (edit) return edit

  const zip = raw.trim().replace(/[\.\-\s]/g, '')
  const cep = await fetchAddress(zip)

  if (!cep) {
    await sendText(state.phone, '❌ CEP não encontrado. Informe somente os números, ex: 01310100:')
    return { zipInvalid: true, editIntent: undefined }
  }

  await sendText(
    state.phone,
    `Encontrei! 📍 *${cep.logradouro}, ${cep.bairro} — ${cep.localidade}/${cep.uf}*\n\nQual o *número* do seu endereço?`,
  )

  return {
    addressDraft: {
      zip: zip.replace(/\D/g, ''),
      street: cep.logradouro,
      neighborhood: cep.bairro,
      city: cep.localidade,
      state: cep.uf,
    },
    zipInvalid: false,
    editIntent: undefined,
  }
}
