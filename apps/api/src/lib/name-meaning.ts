import OpenAI from 'openai'

function client() {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY não configurado')
  return new OpenAI({ apiKey })
}

const SYSTEM_PROMPT = `Você escreve mensagens curtas e calorosas pra pais que acabam de informar o nome do filho, numa conversa de WhatsApp.
Dado um nome, explique em 1-2 frases o significado/origem do nome e conclua com um elogio afetuoso e empático sobre a criança, conectando com esse significado.
Tom: caloroso, breve, natural em português do Brasil, como numa conversa de WhatsApp. No máximo 2-3 frases curtas, no máximo um emoji.
Se não souber a origem exata do nome, fale de forma genérica e afetuosa mesmo assim — nunca diga que não sabe ou admita incerteza.`

export async function describeNameMeaning(name: string): Promise<string> {
  const openai = client()

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 120,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: `Nome: ${name}` },
    ],
  })

  return response.choices[0]?.message?.content?.trim() ?? ''
}
