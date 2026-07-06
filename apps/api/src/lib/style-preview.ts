import OpenAI, { toFile } from 'openai'

function client() {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY não configurado')
  return new OpenAI({ apiKey })
}

export interface StylePreset {
  id: string
  label: string
  prompt: string
}

// "no text" porque essas imagens passam a ser guardadas como referência
// permanente do personagem (não só uma prévia descartável) — texto/letras
// erradas renderizadas aqui contaminariam todas as páginas futuras que usam
// essa imagem como base.
const NO_TEXT_SUFFIX = ' Absolutely no text, no words, no letters rendered in the image.'

// Identidade visual única do produto — não existe mais escolha de estilo.
// Pintura digital cinematográfica de livro infantil premium — NÃO um render
// 3D (nada de visual Pixar/CGI), mais perto de concept art pintada à mão.
export const STYLE_PRESETS: StylePreset[] = [
  {
    id: 'disney',
    label: 'Storybook pintado',
    prompt:
      'Redraw this exact person as a premium, high-end children\'s storybook illustration — the gallery-quality fine ' +
      'art direction of an award-winning hardcover picture book from a top publisher, NOT a generic or mass-market ' +
      'look. Meticulous, polished, expensive-looking, museum-worthy book art. Cinematic hand-painted digital ' +
      'painting style, soft visible brushstrokes, blended colors, slightly soft/diffused edges, organic gradients, ' +
      'no excessive sharpness, like a digital oil painting. Warm and desaturated color harmony (muted greens, golden ' +
      'yellows, cream, warm brown, soft orange), cinematic golden-hour lighting with gentle soft shadows. ' +
      'Slightly oversized head, big but not oversized eyes, extremely innocent expression, rosy cheeks, simplified ' +
      'features, very clean silhouette. This must look PAINTED, not rendered — NOT a 3D render, NOT CGI, NOT a clean ' +
      '3D-animated-movie look. Keep the same facial features, hair and identity as the reference photo.' + NO_TEXT_SUFFIX,
  },
]

export async function generateStylePreview(
  base64Image: string,
  mimeType: string,
  style: StylePreset,
): Promise<string> {
  const openai = client()
  const buffer = Buffer.from(base64Image, 'base64')
  const file = await toFile(buffer, 'photo.png', { type: mimeType })

  const response = await openai.images.edit({
    model: 'gpt-image-1',
    image: file,
    prompt: style.prompt,
    size: '1024x1024',
    input_fidelity: 'high',
  })

  const b64 = response.data?.[0]?.b64_json
  if (!b64) throw new Error(`Falha ao gerar preview de estilo "${style.id}"`)
  return b64
}

// Gera o retrato já estilizado de UMA pessoa (protagonista ou familiar) num
// estilo específico — usado quando ainda não existe uma referência estilizada
// guardada pra essa pessoa nesse estilo.
export async function generateStyledPortrait(
  base64Image: string,
  mimeType: string,
  styleId: string,
): Promise<string> {
  const style = STYLE_PRESETS.find((s) => s.id === styleId) ?? STYLE_PRESETS[0]
  return generateStylePreview(base64Image, mimeType, style)
}
