import { interrupt } from '@langchain/langgraph'
import { sendText } from '../../../lib/whatsapp.js'
import { createChild, saveFamilyAppearance } from '../onboarding.repository.js'
import type { OnboardingState } from '../onboarding.state.js'

function parseBirthDate(input: string): string | null {
  // aceita DD/MM/YYYY ou YYYY-MM-DD
  const parts = input.trim().split(/[\/\-]/)
  if (parts.length !== 3) return null
  const [a, b, c] = parts.map(Number)
  if ([a, b, c].some(isNaN)) return null

  let year: number, month: number, day: number
  if (String(parts[0]).length === 4) {
    ;[year, month, day] = [a, b, c]
  } else {
    ;[day, month, year] = [a, b, c]
  }

  if (year < 2000 || year > 2030 || month < 1 || month > 12 || day < 1 || day > 31) return null
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export async function collectFamilySiblingDetailsNode(state: OnboardingState): Promise<Partial<OnboardingState>> {
  const raw = interrupt<string>('awaiting_family_sibling_details')

  const [namePart, datePart] = raw.split(',').map((s: string) => s.trim())
  const birthDate = datePart ? parseBirthDate(datePart) : null

  if (!namePart || !birthDate) {
    await sendText(state.phone, '❌ Não entendi. Manda assim: *Nome, DD/MM/AAAA* (ex: Lucas, 15/03/2023):')
    return { familySiblingDetailsInvalid: true }
  }

  if (state.subscriberId) {
    await createChild({
      subscriber_id: state.subscriberId,
      name: namePart,
      birth_date: birthDate,
      image_consent: state.imageConsentAccepted ?? false,
    })

    if (state.familyPhotoPathPending) {
      await saveFamilyAppearance(state.subscriberId, state.familyPhotoPathPending, state.familyDescriptionPending ?? '')
    }
  }

  await sendText(state.phone, `✅ ${namePart} cadastrado(a)! Vou usar pra deixar as ilustrações mais especiais.`)

  return {
    familySiblingPending: false,
    familySiblingDetailsInvalid: false,
    familyUnclearNote: undefined,
    familyPhotoPathPending: undefined,
    familyDescriptionPending: undefined,
  }
}
