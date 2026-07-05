import OpenAI from 'openai'
import type { VisualProfile } from '@storybox/db'
import { VISION_EXTRACT_PROMPT } from '@storybox/shared'

function client() {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY não configurado')
  return new OpenAI({ apiKey })
}

export async function extractVisualProfile(
  base64Image: string,
  mimeType: string,
): Promise<VisualProfile> {
  const openai = client()

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 500,
    messages: [
      { role: 'system', content: VISION_EXTRACT_PROMPT },
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: { url: `data:${mimeType};base64,${base64Image}`, detail: 'high' },
          },
          { type: 'text', text: 'Analyze this photo of a child.' },
        ],
      },
    ],
  })

  const raw = response.choices[0]?.message?.content ?? ''
  const json = raw.replace(/```json\n?|\n?```/g, '').trim()
  return JSON.parse(json) as VisualProfile
}

const SCENE_SYSTEM_PROMPT = `Você descreve fotos de momentos especiais de crianças pra alimentar a criação de uma história infantil personalizada.
Descreva em português brasileiro, em 1-2 frases, o que está acontecendo na cena: a ação, o ambiente e a emoção aparente da criança.
Não descreva características físicas da criança (isso já é tratado separadamente). Foque só na cena/momento em si.
Retorne apenas a descrição, sem texto extra.`

export async function describeMomentScene(base64Image: string, mimeType: string): Promise<string> {
  const openai = client()

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 200,
    messages: [
      { role: 'system', content: SCENE_SYSTEM_PROMPT },
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: { url: `data:${mimeType};base64,${base64Image}`, detail: 'low' },
          },
          { type: 'text', text: 'Descreva essa cena.' },
        ],
      },
    ],
  })

  return response.choices[0]?.message?.content?.trim() ?? ''
}

const FAMILY_SYSTEM_PROMPT = `Você descreve a aparência de adultos numa foto de família, pra alimentar prompts de ilustração de um livro infantil.
Descreva em inglês, numa frase por pessoa adulta visível na foto (mãe, pai, etc.), características físicas estáveis: cor e tipo de cabelo, tom de pele, aproximação de idade. Não descreva roupas (isso muda por cena).
Se não houver adultos visíveis ou a foto não for clara, retorne uma string vazia.
Retorne apenas a descrição, sem texto extra, sem markdown.`

export async function describeFamilyAppearance(base64Image: string, mimeType: string): Promise<string> {
  const openai = client()

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 200,
    messages: [
      { role: 'system', content: FAMILY_SYSTEM_PROMPT },
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: { url: `data:${mimeType};base64,${base64Image}`, detail: 'high' },
          },
          { type: 'text', text: 'Describe the adults in this family photo.' },
        ],
      },
    ],
  })

  return response.choices[0]?.message?.content?.trim() ?? ''
}
