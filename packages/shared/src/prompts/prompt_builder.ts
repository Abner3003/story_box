/**
 * prompt_builder.ts
 * 
 * Monta o prompt completo de ilustração combinando:
 * 1. Prefixo de estilo (fixo)
 * 2. Visual profile da criança (extraído da foto)
 * 3. Descrição da cena (gerada pelo LLM por página)
 */

export interface VisualProfile {
  age_description: string
  hair: string
  eyes: string
  skin: string
  raw_description: string
}

// Prefixo fixo de estilo — igual em TODAS as ilustrações do produto
// Alterar aqui muda o estilo de todos os livros
const STYLE_PREFIX = [
  'Children\'s book illustration',
  'soft watercolor style',
  'warm and inviting colors',
  'gentle brushstrokes',
  'cute and expressive characters',
  'minimal clean background',
  'professional children\'s book quality',
].join(', ')

/**
 * Monta o prompt completo para uma página
 * 
 * Exemplo de saída:
 * "Children's book illustration, soft watercolor style, warm and inviting colors,
 *  gentle brushstrokes, cute and expressive characters, minimal clean background,
 *  professional children's book quality.
 *  Protagonist: 2-year-old toddler with curly dark brown hair, big honey-brown eyes,
 *  and warm medium skin tone, named Arthur.
 *  Scene: A toddler sitting cross-legged on a colorful rug surrounded by wooden blocks..."
 */
export function buildIllustrationPrompt(
  scenePrompt: string,
  childName: string,
  visualProfile: VisualProfile,
): string {
  const characterLine = `Protagonist: ${visualProfile.raw_description}, named ${childName}.`
  const sceneLine     = `Scene: ${scenePrompt}`

  return [STYLE_PREFIX + '.', characterLine, sceneLine].join('\n')
}

/**
 * Versão simplificada para quando não temos visual profile ainda
 * Usado no primeiro livro antes da foto ser processada
 */
export function buildIllustrationPromptBasic(
  scenePrompt: string,
  childName: string,
  childAge: number,
): string {
  const characterLine = `Protagonist: a ${childAge}-year-old child named ${childName}.`
  const sceneLine     = `Scene: ${scenePrompt}`

  return [STYLE_PREFIX + '.', characterLine, sceneLine].join('\n')
}

/**
 * Prompt de capa — usa a primeira ilustração como referência
 */
export function buildCoverPrompt(
  bookTitle: string,
  childName: string,
  visualProfile: VisualProfile,
): string {
  return [
    STYLE_PREFIX + ', book cover composition.',
    `Protagonist: ${visualProfile.raw_description}, named ${childName}.`,
    `Scene: A warm, inviting children's book cover featuring ${childName} as the hero,`,
    `centered composition, title space at top, magical and adventurous atmosphere,`,
    `rich colors, the child looking happy and confident.`,
  ].join('\n')
}