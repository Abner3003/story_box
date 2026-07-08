function isTruthy(value: string | undefined): boolean {
  if (!value) return false
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase())
}

export function shouldLogImagePrompts(): boolean {
  return isTruthy(process.env.LOG_IMAGE_PROMPTS) || isTruthy(process.env.DEBUG_IMAGE_PROMPTS)
}

export function logImagePrompt(label: string, prompt: string, meta: Record<string, unknown> = {}): void {
  if (!shouldLogImagePrompts()) return

  console.log(`[prompt] ${label}`, {
    ...meta,
    prompt,
  })
}
