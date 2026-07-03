import OpenAI from 'openai'
import type { StoryJSON } from '@storybox/db'
import { STORY_SYSTEM_PROMPT, STORY_USER_TEMPLATE } from '@storybox/shared'

function client() {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY não configurado')
  return new OpenAI({ apiKey })
}

function fillTemplate(template: string, vars: Record<string, string | undefined>): string {
  const withConditionals = template.replace(
    /\{\{#if (\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g,
    (_, key: string, block: string) => (vars[key] ? block : ''),
  )
  return withConditionals.replace(/\{\{(\w+)\}\}/g, (_, key: string) => vars[key] ?? '')
}

export function calculateAge(birthDate: string): number {
  const birth = new Date(birthDate)
  const now = new Date()
  let age = now.getFullYear() - birth.getFullYear()
  const hadBirthdayThisYear =
    now.getMonth() > birth.getMonth() ||
    (now.getMonth() === birth.getMonth() && now.getDate() >= birth.getDate())
  if (!hadBirthdayThisYear) age -= 1
  return age
}

export async function generateStory(input: {
  childName: string
  childAge: number
  visualProfileRaw: string
  momentText: string
  challengeText: string
  themePref?: string
}): Promise<StoryJSON> {
  const openai = client()

  const userPrompt = fillTemplate(STORY_USER_TEMPLATE, {
    child_name: input.childName,
    child_age: String(input.childAge),
    visual_profile_raw: input.visualProfileRaw,
    moment_text: input.momentText,
    challenge_text: input.challengeText,
    theme_pref: input.themePref,
  })

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 4000,
    messages: [
      { role: 'system', content: STORY_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
  })

  const raw = response.choices[0]?.message?.content ?? ''
  const json = raw.replace(/```json\n?|\n?```/g, '').trim()
  return JSON.parse(json) as StoryJSON
}
