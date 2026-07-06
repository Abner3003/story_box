import OpenAI from 'openai'

function client() {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY não configurado')
  return new OpenAI({ apiKey })
}

export type EditIntent = 'plan' | 'address' | 'child'

const SYSTEM_PROMPT = `Você identifica se uma mensagem enviada por um usuário, durante um cadastro (onboarding) por WhatsApp, é um PEDIDO PARA ALTERAR uma informação já fornecida — em vez de uma resposta normal à pergunta atual que está sendo feita a ele.

Responda APENAS com uma destas palavras, sem explicação, sem pontuação:
- plan    → o usuário quer mudar o PLANO/assinatura escolhido
- address → o usuário quer mudar o ENDEREÇO ou CEP de entrega
- child   → o usuário quer corrigir nome, data de nascimento ou dados de um FILHO já informado
- none    → a mensagem é apenas uma resposta normal à pergunta atual (nome, número, CEP, data, "sim"/"não", uma foto, etc.)

Na dúvida, responda none.`

export async function detectEditIntent(message: string): Promise<EditIntent | null> {
  try {
    const openai = client()

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 5,
      temperature: 0,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: message },
      ],
    })

    const raw = (response.choices[0]?.message?.content ?? '').trim().toLowerCase()
    if (raw === 'plan' || raw === 'address' || raw === 'child') return raw
    return null
  } catch (err) {
    // Essa checagem roda em TODO node do onboarding (via checkEditIntent) —
    // se a OpenAI falhar (cota, rede, timeout), é melhor seguir o fluxo
    // normal (assumindo "sem intenção de edição") do que travar a pessoa
    // no meio do cadastro por causa de uma verificação secundária.
    console.error('[intent] falha ao detectar intenção de edição, seguindo sem detecção:', err)
    return null
  }
}
