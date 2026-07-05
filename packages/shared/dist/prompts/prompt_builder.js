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
        'Children\'s picture book illustration in a semi-realistic painterly style',
        'rich watercolor and gouache textures with visible brushwork',
        'warm natural lighting and soft shadows giving real depth and volume',
        'detailed, believable background environment (not a blank/minimal backdrop)',
        'characters with naturalistic proportions and expressive but grounded faces',
        'award-winning professional children\'s book illustration quality',
        'NOT flat, NOT vector, NOT sticker-style, NOT plastic-looking',
    ].join(', '),
    cartoon3d: [
        'Children\'s picture book illustration, painterly 3D-rendered look',
        'soft cinematic lighting with real depth of field and gentle shadows',
        'richly detailed, textured background environment',
        'big expressive eyes but otherwise naturalistic proportions and skin/hair texture',
        'award-winning professional children\'s book illustration quality',
        'NOT flat, NOT vector, NOT sticker-style',
    ].join(', '),
    flat: [
        'Children\'s book illustration',
        'modern flat vector style',
        'clean shapes',
        'bold flat colors',
        'minimal shading',
        'detailed background environment matching the scene',
        'professional children\'s book quality',
    ].join(', '),
};
function stylePrefix(styleId) {
    return STYLE_PREFIXES[styleId] ?? STYLE_PREFIXES[DEFAULT_STYLE];
}
// O prompt em si é em inglês (pro modelo de imagem entender melhor), mas
// isso faz o gpt-image-1 às vezes "escrever" palavras em inglês na própria
// ilustração (letreiros, título, etc.) — o texto certo em português já é
// sobreposto depois via PDF, então a imagem nunca deve conter texto nenhum.
const NO_TEXT_RULE = 'absolutely no text, no words, no letters, no writing, no signage of any kind rendered in the image';
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
export function buildIllustrationPrompt(scenePrompt, childName, visualProfile, styleId, familyDescription) {
    const characterLine = `Protagonist: ${visualProfile.raw_description}, named ${childName}.`;
    const familyLine = familyDescription ? `Family members (when present in the scene): ${familyDescription}` : undefined;
    const sceneLine = `Scene: ${scenePrompt}`;
    return [stylePrefix(styleId) + ', ' + NO_TEXT_RULE + '.', characterLine, familyLine, sceneLine].filter(Boolean).join('\n');
}
/**
 * Versão simplificada para quando não temos visual profile ainda
 * Usado no primeiro livro antes da foto ser processada
 */
export function buildIllustrationPromptBasic(scenePrompt, childName, childAge, styleId) {
    const characterLine = `Protagonist: a ${childAge}-year-old child named ${childName}.`;
    const sceneLine = `Scene: ${scenePrompt}`;
    return [stylePrefix(styleId) + ', ' + NO_TEXT_RULE + '.', characterLine, sceneLine].join('\n');
}
/**
 * Prompt de capa — usa a primeira ilustração como referência
 */
export function buildCoverPrompt(bookTitle, childName, visualProfile, styleId, familyDescription) {
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
    ].filter(Boolean).join('\n');
}
//# sourceMappingURL=prompt_builder.js.map