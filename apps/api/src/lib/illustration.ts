import OpenAI, { toFile } from 'openai'

function client() {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY não configurado')
  return new OpenAI({ apiKey })
}

export interface ReferenceImage {
  base64: string
  mimeType: string
}

// Com só um prompt em texto (images.generate), o modelo nunca "vê" a foto de
// verdade da criança/família — só uma descrição textual genérica (cor de
// cabelo, tom de pele) — por isso os pais saem sem nenhuma semelhança com a
// foto real. Passando as fotos como referência (images.edit, que aceita até
// 16 imagens pro gpt-image-1), o modelo usa a aparência real de cada um.
export async function generateImage(prompt: string, references?: ReferenceImage[]): Promise<string> {
  const openai = client()

  if (references?.length) {
    const files = await Promise.all(
      references.map((ref, i) => toFile(Buffer.from(ref.base64, 'base64'), `ref-${i}.png`, { type: ref.mimeType })),
    )

    const response = await openai.images.edit({
      model: 'gpt-image-1',
      image: files,
      prompt,
      size: '1024x1024',
      input_fidelity: 'high',
    })

    const b64 = response.data?.[0]?.b64_json
    if (!b64) throw new Error('Falha ao gerar imagem da ilustração (com referência)')
    return b64
  }

  const response = await openai.images.generate({
    model: 'gpt-image-1',
    prompt,
    size: '1024x1024',
  })

  const b64 = response.data?.[0]?.b64_json
  if (!b64) throw new Error('Falha ao gerar imagem da ilustração')
  return b64
}
