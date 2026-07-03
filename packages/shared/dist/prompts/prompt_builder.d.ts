/**
 * prompt_builder.ts
 *
 * Monta o prompt completo de ilustração combinando:
 * 1. Prefixo de estilo (escolhido pela família no onboarding)
 * 2. Visual profile da criança (extraído da foto)
 * 3. Descrição da cena (gerada pelo LLM por página)
 */
export interface VisualProfile {
    age_description: string;
    hair: string;
    eyes: string;
    skin: string;
    raw_description: string;
}
export type StyleId = 'watercolor' | 'cartoon3d' | 'flat';
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
export declare function buildIllustrationPrompt(scenePrompt: string, childName: string, visualProfile: VisualProfile, styleId?: string): string;
/**
 * Versão simplificada para quando não temos visual profile ainda
 * Usado no primeiro livro antes da foto ser processada
 */
export declare function buildIllustrationPromptBasic(scenePrompt: string, childName: string, childAge: number, styleId?: string): string;
/**
 * Prompt de capa — usa a primeira ilustração como referência
 */
export declare function buildCoverPrompt(bookTitle: string, childName: string, visualProfile: VisualProfile, styleId?: string): string;
//# sourceMappingURL=prompt_builder.d.ts.map