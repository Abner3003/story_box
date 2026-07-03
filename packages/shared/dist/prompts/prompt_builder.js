/**
 * prompt_builder.ts
 *
 * Monta o prompt completo de ilustração combinando:
 * 1. Prefixo de estilo (escolhido pela família no onboarding)
 * 2. Visual profile da criança (extraído da foto)
 * 3. Descrição da cena (gerada pelo LLM por página)
 */
const DEFAULT_STYLE = 'watercolor';
// Um prefixo de estilo por opção oferecida em ask-style-choice.ts — mesmo
// espírito dos prompts de preview (style-preview.ts), mas escritos para
// geração de cena via texto (images.generate), não edição de foto (images.edit).
const STYLE_PREFIXES = {
    watercolor: [
        'Children\'s book illustration',
        'soft watercolor style',
        'warm and inviting colors',
        'gentle brushstrokes',
        'cute and expressive characters',
        'minimal clean background',
        'professional children\'s book quality',
    ].join(', '),
    cartoon3d: [
        'Children\'s book illustration',
        'cute 3D animated cartoon style',
        'big expressive eyes',
        'soft lighting',
        'vibrant colors',
        'minimal clean background',
        'professional children\'s book quality',
    ].join(', '),
    flat: [
        'Children\'s book illustration',
        'modern flat vector style',
        'clean shapes',
        'bold flat colors',
        'minimal shading',
        'minimal clean background',
        'professional children\'s book quality',
    ].join(', '),
};
function stylePrefix(styleId) {
    return STYLE_PREFIXES[styleId] ?? STYLE_PREFIXES[DEFAULT_STYLE];
}
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
export function buildIllustrationPrompt(scenePrompt, childName, visualProfile, styleId) {
    const characterLine = `Protagonist: ${visualProfile.raw_description}, named ${childName}.`;
    const sceneLine = `Scene: ${scenePrompt}`;
    return [stylePrefix(styleId) + '.', characterLine, sceneLine].join('\n');
}
/**
 * Versão simplificada para quando não temos visual profile ainda
 * Usado no primeiro livro antes da foto ser processada
 */
export function buildIllustrationPromptBasic(scenePrompt, childName, childAge, styleId) {
    const characterLine = `Protagonist: a ${childAge}-year-old child named ${childName}.`;
    const sceneLine = `Scene: ${scenePrompt}`;
    return [stylePrefix(styleId) + '.', characterLine, sceneLine].join('\n');
}
/**
 * Prompt de capa — usa a primeira ilustração como referência
 */
export function buildCoverPrompt(bookTitle, childName, visualProfile, styleId) {
    return [
        stylePrefix(styleId) + ', book cover composition.',
        `Protagonist: ${visualProfile.raw_description}, named ${childName}.`,
        `Scene: A warm, inviting children's book cover featuring ${childName} as the hero,`,
        `centered composition, title space at top, magical and adventurous atmosphere,`,
        `rich colors, the child looking happy and confident.`,
    ].join('\n');
}
//# sourceMappingURL=prompt_builder.js.map