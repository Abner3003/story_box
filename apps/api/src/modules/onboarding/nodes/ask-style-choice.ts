import { sendText, sendImage, sendButtons } from '../../../lib/whatsapp.js'
import { generateAllStylePreviews } from '../../../lib/style-preview.js'
import { downloadChildPhoto, uploadStylePreview } from '../onboarding.repository.js'
import { formatOptionsList } from './show-plans.js'
import type { OnboardingState } from '../onboarding.state.js'

const INTER_MESSAGE_DELAY_MS = 1200
const PRE_BUTTONS_DELAY_MS = 3000
const MAX_NATIVE_BUTTONS = 3

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function askStyleChoiceNode(state: OnboardingState): Promise<Partial<OnboardingState>> {
  const currentIndex = state.featuredChildIndices[state.photoQueueIndex]
  const currentChildId = state.childIds[currentIndex]
  const childName = state.children[currentIndex]?.name ?? 'seu filho'

  // Sem foto real (ex: simulação sem mídia) — não dá pra gerar preview, pula a etapa
  if (!state.currentChildPhotoPath || !currentChildId) {
    return { styleOptions: [] }
  }

  try {
    await sendText(
      state.phone,
      `🎨 Gerando 3 estilos de ilustração pra *${childName}*! Isso pode levar até 2 minutos — pode aguardar por aqui, eu mando assim que ficar pronto 😊`,
    )

    const { base64, mimeType } = await downloadChildPhoto(state.currentChildPhotoPath)
    const previews = await generateAllStylePreviews(base64, mimeType)

    const styleOptions: Array<{ id: string; label: string }> = []
    for (const [index, { style, base64Png }] of previews.entries()) {
      const url = await uploadStylePreview(currentChildId, style.id, base64Png)
      await sendImage(state.phone, url, `${index + 1}️⃣ *${style.label}*`)
      styleOptions.push({ id: style.id, label: style.label })
      if (index < previews.length - 1) await sleep(INTER_MESSAGE_DELAY_MS)
    }

    if (styleOptions.length <= MAX_NATIVE_BUTTONS) {
      // dá tempo da última imagem (busca de URL externa pela Meta) ser
      // entregue antes do botão, senão o botão pode chegar primeiro
      await sleep(PRE_BUTTONS_DELAY_MS)
      await sendButtons(
        state.phone,
        `Qual estilo você mais gostou pra *${childName}*?`,
        styleOptions.map((opt) => ({ id: opt.id, title: opt.label })),
      )
    } else {
      await sendText(
        state.phone,
        `Qual estilo você mais gostou pra *${childName}*? Digite ${formatOptionsList(styleOptions.length)}:`,
      )
    }

    return { styleOptions, styleChoiceInvalid: false }
  } catch {
    await sendText(
      state.phone,
      '⚠️ Não consegui gerar os estilos agora — vou seguir com o padrão, dá pra ajustar depois.',
    )
    return { styleOptions: [] }
  }
}
