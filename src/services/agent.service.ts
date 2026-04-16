import { z } from 'zod'
import { redis } from '../lib/redis.js'
import { openai } from '../lib/openai.js'
import type { AgentOutput, ChatMessage } from '../types/agent.js'

const AgentOutputSchema = z.object({
  output: z.string(),
  content_type: z.enum(['text', 'audio']),
})

const MEMORY_TTL = 3600
const MEMORY_MAX_MESSAGES = 50
const MODEL = 'gpt-4.1-mini'

const SYSTEM_PROMPT = `Você é um atendente humano respondendo clientes no WhatsApp.

REGRAS DE FORMATAÇÃO:
- Separe cada frase usando quebra de linha: \n
- Use apenas UM \n entre as frases
- Não escreva parágrafos longos, use mensagens curtas e naturais

TOM DE VOZ:
- Seja cordial e amigável
- Use emojis ocasionalmente quando apropriado
- Responda de forma natural
- Use expressões brasileiras naturais

Retorne SEMPRE um JSON válido com exatamente dois campos:
- "output": sua resposta (string)
- "content_type": "text" ou "audio" dependendo do tom e contexto da conversa

Responda APENAS com o JSON, sem markdown, sem explicações.`

export const agentService = {
  async run(sender: string, userMessage: string): Promise<AgentOutput> {
    const memoryKey = `${sender}_memory`

    const raw = await redis.get(memoryKey)
    let history: ChatMessage[] = []
    if (raw) {
      try {
        history = JSON.parse(raw) as ChatMessage[]
      } catch {
        // corrupted memory — start fresh, do not crash the job
      }
    }

    history.push({ role: 'user', content: userMessage })

    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...history],
      response_format: { type: 'json_object' },
    })

    const responseContent = completion.choices[0].message.content ?? '{}'

    let parsed: AgentOutput
    try {
      parsed = AgentOutputSchema.parse(JSON.parse(responseContent))
    } catch {
      // malformed LLM response — return safe text fallback
      parsed = { output: 'Desculpe, não consegui processar sua mensagem.', content_type: 'text' }
    }

    history.push({ role: 'assistant', content: responseContent })

    if (history.length > MEMORY_MAX_MESSAGES) {
      history = history.slice(-MEMORY_MAX_MESSAGES)
    }

    await redis.set(memoryKey, JSON.stringify(history), 'EX', MEMORY_TTL)

    return parsed
  },
}
