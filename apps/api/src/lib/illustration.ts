import OpenAI from 'openai'

function client() {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY não configurado')
  return new OpenAI({ apiKey })
}

export async function generateImage(prompt: string): Promise<string> {
  const openai = client()

  const response = await openai.images.generate({
    model: 'gpt-image-1',
    prompt,
    size: '1024x1024',
  })

  const b64 = response.data?.[0]?.b64_json
  if (!b64) throw new Error('Falha ao gerar imagem da ilustração')
  return b64
}
