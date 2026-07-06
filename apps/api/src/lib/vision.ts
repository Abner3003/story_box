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

