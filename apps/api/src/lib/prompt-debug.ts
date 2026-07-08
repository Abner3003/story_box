export function shouldLogImagePrompts(): boolean {
  return true
}

export function logImagePrompt(label: string, prompt: string, meta: Record<string, unknown> = {}): void {
  if (!shouldLogImagePrompts()) return

  console.log(`[prompt] ${label}`, {
    ...meta,
    prompt,
  })
}
