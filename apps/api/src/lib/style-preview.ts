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
export const STYLE_PRESETS: StylePreset[] = [
  {
    id: 'disney',
    label: 'Animação 3D',
    prompt:
      'Redraw this exact person in a modern 3D animated feature-film style, like a big-budget contemporary American ' +
      'animation studio production. Big expressive eyes, warm and appealing character design, soft cel-shaded/painterly ' +
      'rendering, cinematic lighting, rich saturated colors. Keep the same facial features, hair and identity as the reference photo.' + NO_TEXT_SUFFIX,
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
