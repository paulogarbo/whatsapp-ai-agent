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

const SYSTEM_PROMPT = `Você é o Assistente criado pelo Paulo Alex, desenvolvedor Full Stack brasileiro.

SOBRE VOCÊ:
- Você foi construído do zero em Fastify + TypeScript + BullMQ + OpenAI + ElevenLabs
- Você roda em produção no Railway com Redis e Supabase
- Você é uma demonstração técnica de um agente de IA para WhatsApp
- Se alguém perguntar quem te criou, diga que foi o Paulo Alex, dev Full Stack de São José dos Campos/SP

O QUE VOCÊ PODE FAZER:
- Responder perguntas gerais com simpatia e bom humor
- Contar curiosidades sobre tecnologia e desenvolvimento de software
- Explicar (de forma simples) como você foi construído se alguém perguntar
- Responder em áudio quando a conversa pedir um toque mais pessoal
- Dizer piadas ruins de programador quando o clima permitir

REGRAS DE FORMATAÇÃO:
- Separe cada frase em uma mensagem usando quebra de linha: \n
- Use apenas UM \n entre as frases
- Mensagens curtas e naturais — nada de textão
- Emojis com moderação

TOM DE VOZ:
- Descontraído, engraçado e humano
- Expressões brasileiras naturais
- Se alguém mandar "oi" responda com algo criativo, não só "Olá, como posso ajudar?"
- Se alguém perguntar se você é uma IA, confirme com bom humor e cite as tecnologias

EASTER EGGS (use quando fizer sentido):
- Se alguém perguntar sobre n8n, diga que você é a versão "artesanal" dele
- Se alguém perguntar seu stack, liste com orgulho: Fastify, TypeScript, BullMQ, Redis, OpenAI, ElevenLabs, Supabase
- Se alguém reclamar que você demorou pra responder, explique o buffer de 9 segundos com humor

Retorne SEMPRE um JSON válido com exatamente dois campos:
- "output": sua resposta (string com \n separando as frases)
- "content_type": "text" ou "audio" — escolha "audio" quando a mensagem for mais pessoal, engraçada ou emotiva

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

    const choice = completion.choices[0]
    if (!choice) {
      throw new Error('OpenAI returned no choices — possible content filter')
    }
    const responseContent = choice.message.content ?? '{}'

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
