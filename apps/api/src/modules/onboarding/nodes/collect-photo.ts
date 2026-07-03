import { interrupt } from '@langchain/langgraph'
import { sendText, downloadMedia } from '../../../lib/whatsapp.js'
import { extractVisualProfile } from '../../../lib/vision.js'
import { getSimulatedMedia, clearSimulatedMedia } from '../../../lib/simulate-media.js'
import { saveChildVisualProfile, uploadChildPhoto } from '../onboarding.repository.js'
import { checkEditIntent } from '../edit-intent.js'
import type { OnboardingState } from '../onboarding.state.js'

const IMAGE_ID_RE = /^\[image:(.+)\]$/

const FALLBACK_PROFILE = {
  age_description: '3-year-old',
  hair: 'brown hair',
  eyes: 'brown eyes',
  skin: 'light skin tone',
  raw_description: 'A 3-year-old child with brown hair and brown eyes',
}

export async function collectPhotoNode(state: OnboardingState): Promise<Partial<OnboardingState>> {
  const msg = interrupt<string>('awaiting_photo')

  const match = IMAGE_ID_RE.exec(msg)
  if (!match) {
    const edit = await checkEditIntent(msg, 'collect_photo')
    if (edit) return edit

    await sendText(state.phone, '❌ Não recebi uma foto. Por favor, envie a imagem diretamente no chat:')
    return { photoInvalid: true, editIntent: undefined }
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
        return { photoInvalid: true, editIntent: undefined }
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

    const profile = base64 ? await extractVisualProfile(base64, mimeType) : FALLBACK_PROFILE

    const currentIndex = state.featuredChildIndices[state.photoQueueIndex]
    const currentChildId = state.childIds[currentIndex]

    let photoPath: string | undefined
    if (currentChildId) {
      if (base64) photoPath = await uploadChildPhoto(currentChildId, base64, mimeType)
      await saveChildVisualProfile(currentChildId, profile, photoPath)
    }

    await sendText(state.phone, '📸 Foto analisada com sucesso!')

    return { photoInvalid: false, currentChildPhotoPath: photoPath, editIntent: undefined }
  } catch {
    await sendText(state.phone, '❌ Não consegui processar a foto. Por favor, envie outra imagem com boa iluminação:')
    return { photoInvalid: true, editIntent: undefined }
  }
}
