/**
 * prompt_builder.ts
 *
 * Monta o prompt completo de ilustração combinando:
 * 1. Prefixo de estilo (escolhido pela família no onboarding)
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

export type StyleId = 'disney'

// Identidade visual única do produto — não existe mais escolha de estilo
// pela família. Ilustração de livro infantil premium: pintura digital
// cinematográfica, pincelada visível, NÃO um render 3D (nada de visual
// Pixar/CGI) — mais perto de concept art pintada à mão.
const STORYBOOK_STYLE_PREFIX = [
  'Premium, high-end children\'s storybook illustration — the gallery-quality fine art direction of an award-winning hardcover picture book from a top publisher, NOT a generic or mass-market look. Cinematic hand-painted digital painting style, soft visible brushstrokes, cozy warm atmosphere, extremely expressive characters, magical lighting, artistic painted vignette at the frame edges',
  'Every image must feel like a museum-worthy, collectible piece of book art — meticulous, polished, expensive-looking, the kind of illustration parents would frame, not a quick or generic children\'s app graphic',
  'Character design: slightly oversized head, big but not oversized eyes, extremely innocent expression, rosy cheeks, minimal simple nose, simple mouth, very clean silhouette, simplified hands, exaggerated childlike proportions',
  'Rendering quality is the key trait: this must look PAINTED, not rendered — soft brushstrokes, blended colors, slightly soft/diffused edges, painted volumes, organic gradients, no excessive sharpness, like a digital oil painting',
  'Color palette: warm and desaturated — muted greens, golden yellows, cream, warm brown, soft orange; nothing oversaturated, a coherent warm harmony throughout',
  'Lighting: cinematic golden-hour feel — god rays, volumetric light, golden light, soft bounce light, gentle bloom, extremely soft shadows',
  'Environment: backgrounds stay soft, simplified and low-detail so they never compete with the character — painterly trees and foliage, huge sense of depth and atmosphere, generous breathing space (air) between elements, background painted in soft receding layers (foreground, character, midground, atmosphere, fully soft-focus distance)',
  'Textures: no photographic textures anywhere — wood, stone, water, leaves and skin are all painted/illustrated, never photo-real',
  'Overall feeling: every image should read as its own little story — curiosity, wonder, discovery, friendship, comfort',
  'NOT a 3D render, NOT CGI, NOT a clean 3D-animated-movie look, NOT flat, NOT vector, NOT sticker-style, NOT plastic-looking',
  'NOT vintage, NOT sepia-toned, NOT muted/washed-out in an old-fashioned way, NOT a religious-pamphlet look',
].join('. ')

function stylePrefix(_styleId?: string): string {
  return STORYBOOK_STYLE_PREFIX
}

// O prompt em si é em inglês (pro modelo de imagem entender melhor), mas
// isso faz o gpt-image-1 às vezes "escrever" palavras em inglês na própria
// ilustração (letreiros, título, etc.) — o texto certo em português já é
// sobreposto depois via PDF, então a imagem nunca deve conter texto nenhum.
const NO_TEXT_RULE = 'absolutely no text, no words, no letters, no writing, no signage of any kind rendered in the image'

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
  styleId?: string,
  familyDescription?: string,
): string {
  const characterLine = `Protagonist: ${visualProfile.raw_description}, named ${childName}.`
  const familyLine     = familyDescription ? `Family members (when present in the scene): ${familyDescription}` : undefined
  const sceneLine     = `Scene: ${scenePrompt}`

  return [stylePrefix(styleId) + ', ' + NO_TEXT_RULE + '.', characterLine, familyLine, sceneLine].filter(Boolean).join('\n')
}

/**
 * Versão simplificada para quando não temos visual profile ainda
 * Usado no primeiro livro antes da foto ser processada
 */
export function buildIllustrationPromptBasic(
  scenePrompt: string,
  childName: string,
  childAge: number,
  styleId?: string,
): string {
  const characterLine = `Protagonist: a ${childAge}-year-old child named ${childName}.`
  const sceneLine     = `Scene: ${scenePrompt}`

  return [stylePrefix(styleId) + ', ' + NO_TEXT_RULE + '.', characterLine, sceneLine].join('\n')
}

/**
 * Prompt de capa — usa a primeira ilustração como referência
 */
export function buildCoverPrompt(
  bookTitle: string,
  childName: string,
  visualProfile: VisualProfile,
  styleId?: string,
  familyDescription?: string,
): string {
  return [
    stylePrefix(styleId) + `, book cover composition, ${NO_TEXT_RULE}.`,
    'This is the FRONT COVER — the single most creative, striking and memorable image in the entire book,',
    'since readers judge the whole book by this one picture. Push the composition further than a regular',
    'interior page: a bold, dynamic hero pose for the protagonist, a richer and more magical/iconic scene',
    `than any inside page, capturing the spirit of the story "${bookTitle}" at a glance.`,
    `Protagonist: ${visualProfile.raw_description}, named ${childName}.`,
    familyDescription ? `Family members (when present in the scene): ${familyDescription}` : undefined,
    `Scene: A warm, inviting children's book cover featuring ${childName} as the confident, joyful hero,`,
    'centered/rule-of-thirds composition with a calmer, less busy area near the top and bottom edges',
    '(a title and other text will be added separately on top of the image),',
    'magical and adventurous atmosphere, rich and vibrant colors, strong sense of wonder.',
  ].filter(Boolean).join('\n')
}
