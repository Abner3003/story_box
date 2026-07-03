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

export const STYLE_PRESETS: StylePreset[] = [
  {
    id: 'watercolor',
    label: 'Aquarela',
    prompt:
      'Redraw this exact child as a warm, soft watercolor children\'s book illustration. Gentle brush strokes, ' +
      'pastel color palette, storybook style. Keep the same facial features, hair and identity as the reference photo.',
  },
  {
    id: 'cartoon3d',
    label: 'Cartoon 3D',
    prompt:
      'Redraw this exact child as a cute 3D animated cartoon character, in the style of modern animated movies. ' +
      'Big expressive eyes, soft lighting, vibrant colors. Keep the same facial features, hair and identity as the reference photo.',
  },
  {
    id: 'flat',
    label: 'Ilustração Flat',
    prompt:
      'Redraw this exact child as a modern flat vector illustration for a children\'s book cover. ' +
      'Clean shapes, bold flat colors, minimal shading. Keep the same facial features, hair and identity as the reference photo.',
  },
]

async function generateStylePreview(
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

export interface StylePreviewResult {
  style: StylePreset
  base64Png: string
}

export async function generateAllStylePreviews(
  base64Image: string,
  mimeType: string,
): Promise<StylePreviewResult[]> {
  return Promise.all(
    STYLE_PRESETS.map(async (style) => ({
      style,
      base64Png: await generateStylePreview(base64Image, mimeType, style),
    })),
  )
}
