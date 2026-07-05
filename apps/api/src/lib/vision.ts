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

export interface FamilyPhotoAnalysis {
  // rótulos em português pra confirmar com a família (ex: ["papai", "mamãe"])
  recognized: string[]
  // descrição em português de alguém que apareceu na foto mas cujo papel
  // não ficou claro (geralmente uma criança) — null se não houver ninguém assim
  unclearNote: string | null
  // descrição em inglês, pronta pra entrar no prompt de ilustração
  illustrationDescription: string
}

const FAMILY_ANALYSIS_PROMPT = `Você analisa fotos de família para alimentar a criação de um livro infantil personalizado.
A criança que é a protagonista do livro já tem perfil visual próprio — não a descreva aqui (ignore quem for claramente o bebê/criança foco da foto, se estiver evidente pelo contexto).
Para cada OUTRA pessoa na foto (pai, mãe, avó, avô, irmão, irmã, etc.):
- Se conseguir identificar o papel familiar com razoável confiança, inclua um rótulo curto em português em "recognized" (ex: "papai", "mamãe", "irmão mais velho", "irmã caçula").
- Se houver alguém (geralmente uma criança) cuja relação/papel você NÃO tem como determinar com confiança pela foto, descreva essa pessoa em "unclear_note", em português, de forma natural e breve (ex: "um menino de aproximadamente 5 anos"). Preste atenção a sinais de gênero — corte de cabelo curto costuma indicar menino, não assuma menina por padrão. Se não houver ninguém incerto, "unclear_note" deve ser null.
Em "illustration_description", escreva em inglês, uma frase por pessoa RECONHECIDA (papel + gênero explícito, ex: "The father"/"The mother"/"The older brother" + cor/tipo de cabelo + tom de pele + idade aproximada). Não descreva roupas. Não inclua a pessoa de "unclear_note" aqui.
Se não houver ninguém além da protagonista visível ou a foto não for clara, "recognized" deve ser [] e "illustration_description" deve ser "".
Responda apenas em JSON, sem markdown: {"recognized": string[], "unclear_note": string | null, "illustration_description": string}`

export async function analyzeFamilyPhoto(base64Image: string, mimeType: string): Promise<FamilyPhotoAnalysis> {
  const openai = client()

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 400,
    messages: [
      { role: 'system', content: FAMILY_ANALYSIS_PROMPT },
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: { url: `data:${mimeType};base64,${base64Image}`, detail: 'high' },
          },
          { type: 'text', text: 'Analyze every family member in this photo, including siblings.' },
        ],
      },
    ],
  })

  const raw = response.choices[0]?.message?.content ?? ''
  const json = raw.replace(/```json\n?|\n?```/g, '').trim()

  try {
    const parsed = JSON.parse(json)
    return {
      recognized: Array.isArray(parsed.recognized) ? parsed.recognized : [],
      unclearNote: typeof parsed.unclear_note === 'string' ? parsed.unclear_note : null,
      illustrationDescription: typeof parsed.illustration_description === 'string' ? parsed.illustration_description : '',
    }
  } catch {
    return { recognized: [], unclearNote: null, illustrationDescription: '' }
  }
}
