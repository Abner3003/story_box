import OpenAI from 'openai'
import type { VisualProfile } from '@storybox/db'

function client() {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY não configurado')
  return new OpenAI({ apiKey })
}

const SYSTEM_PROMPT = `Você é um sistema de análise de fotos de crianças para criação de livros ilustrados personalizados.
Analise a foto e retorne um JSON com o perfil visual da criança. Seja descritivo em inglês pois os prompts de imagem serão em inglês.
Retorne APENAS o JSON, sem texto extra.`

const USER_PROMPT = `Analise esta foto de criança e retorne um JSON com este formato exato:
{
  "age_description": "descrição da idade aparente em inglês, ex: '3-year-old'",
  "hair": "descrição do cabelo em inglês, ex: 'curly dark brown hair'",
  "eyes": "descrição dos olhos em inglês, ex: 'large brown eyes'",
  "skin": "descrição do tom de pele em inglês, ex: 'warm light brown skin tone'",
  "raw_description": "descrição completa da criança em inglês para uso em prompts de imagem"
}`

export async function extractVisualProfile(
  base64Image: string,
  mimeType: string,
): Promise<VisualProfile> {
  const openai = client()

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 500,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: { url: `data:${mimeType};base64,${base64Image}`, detail: 'high' },
          },
          { type: 'text', text: USER_PROMPT },
        ],
      },
    ],
  })

  const raw = response.choices[0]?.message?.content ?? ''
  const json = raw.replace(/```json\n?|\n?```/g, '').trim()
  return JSON.parse(json) as VisualProfile
}
