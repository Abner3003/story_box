import { interrupt } from '@langchain/langgraph'
import { sendText, downloadMedia } from '../../../lib/whatsapp.js'
import { extractVisualProfile } from '../../../lib/vision.js'
import { getSimulatedMedia, clearSimulatedMedia } from '../../../lib/simulate-media.js'
import { createChild, saveChildVisualProfile } from '../onboarding.repository.js'
import type { OnboardingState } from '../onboarding.state.js'

const IMAGE_ID_RE = /^\[image:(.+)\]$/

const FALLBACK_PROFILE = {
  age_description: '3-year-old',
  hair: 'brown hair',
  eyes: 'brown eyes',
  skin: 'light skin tone',
  raw_description: 'A 3-year-old child with brown hair and brown eyes',
}

async function ensureChildrenSaved(state: OnboardingState): Promise<string[]> {
  if (state.childIds.length > 0) return state.childIds
  if (!state.subscriberId) return []

  const ids: string[] = []
  for (const child of state.children) {
    const id = await createChild({
      subscriber_id: state.subscriberId,
      name:          child.name,
      birth_date:    child.birthDate,
      image_consent: state.imageConsentAccepted ?? false,
    })
    ids.push(id)
  }
  return ids
}

export async function collectPhotoNode(state: OnboardingState): Promise<Partial<OnboardingState>> {
  const childIds = await ensureChildrenSaved(state)
  const firstName = state.children[0]?.name ?? 'seu filho'

  await sendText(
    state.phone,
    `📸 Agora me mande uma foto recente de *${firstName}*!\n\nDica: foto com boa iluminação e o rostinho bem visível 😊`,
  )

  while (true) {
    const msg = interrupt<string>('awaiting_photo')

    const match = IMAGE_ID_RE.exec(msg)
    if (!match) {
      await sendText(state.phone, '❌ Não recebi uma foto. Por favor, envie a imagem diretamente no chat:')
      continue
    }

    const mediaId = match[1]
    await sendText(state.phone, '📸 Foto recebida! Estou analisando...')

    try {
      let base64: string
      let mimeType: string

      if (mediaId.startsWith('sim:')) {
        // Foto enviada via /simulate/photo — busca do store em memória
        const stored = getSimulatedMedia(mediaId)
        if (!stored) {
          await sendText(state.phone, '❌ Mídia simulada expirou. Envie a foto novamente:')
          continue
        }
        base64   = stored.base64
        mimeType = stored.mimeType
        clearSimulatedMedia(mediaId)
      } else if (state.simulate) {
        // Simulate sem foto real — usa perfil fictício
        base64   = ''
        mimeType = 'image/jpeg'
      } else {
        // Produção — baixa da API do WhatsApp
        const media = await downloadMedia(mediaId)
        base64   = media.base64
        mimeType = media.mimeType
      }

      const profile = (base64 && !state.simulate)
        ? await extractVisualProfile(base64, mimeType)
        : base64
          ? await extractVisualProfile(base64, mimeType)  // sim: com foto real → roda Vision
          : FALLBACK_PROFILE                               // simulate sem foto → usa fallback

      if (childIds[0]) await saveChildVisualProfile(childIds[0], profile)

      await sendText(state.phone, '✅ Foto analisada! Perfil visual criado com sucesso.')
      return { childIds }
    } catch {
      await sendText(state.phone, '❌ Não consegui processar a foto. Por favor, envie outra imagem com boa iluminação:')
    }
  }
}
