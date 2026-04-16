import type { ChatCompletionMessageParam } from 'openai/resources'

export type ChatMessage = ChatCompletionMessageParam

export interface AgentOutput {
  output: string
  content_type: 'text' | 'audio'
}
