import type { WebhookBody } from '../schemas/webhook.schema.js'
import type { ContentType, NormalizedMessage } from '../types/message.js'

function resolveContentType(message: WebhookBody['message']): ContentType {
  if (message.type === 'text') return 'text'

  const mimetype =
    typeof message.content === 'object' && message.content !== null
      ? message.content.mimetype ?? ''
      : ''

  if (mimetype.includes('audio') || message.mediaType === 'ptt') return 'audio'
  if (mimetype.includes('image')) return 'image'
  if (mimetype.includes('video')) return 'video'
  if (mimetype.includes('application')) return 'document'

  return 'unknown'
}

function resolveSender(message: WebhookBody['message']): string {
  if (message.sender.includes('@lid') && message.sender_pn) {
    return message.sender_pn
  }
  return message.sender
}

export function normalizeMessage(body: WebhookBody): NormalizedMessage {
  const { message } = body

  const sender = resolveSender(message)

  const messageText =
    typeof message.content === 'string' ? message.content : ''

  const ts =
    typeof message.messageTimestamp === 'string'
      ? parseInt(message.messageTimestamp, 10)
      : message.messageTimestamp

  const messageTimestamp = Number.isNaN(ts)
    ? Math.floor(Date.now() / 1000)
    : ts

  const fromMe =
    typeof message.fromMe === 'string'
      ? message.fromMe === 'true'
      : (message.fromMe ?? false)

  return {
    id: message.id,
    sender,
    senderName: message.senderName ?? sender,
    message: messageText,
    messageTimestamp,
    content_type: resolveContentType(message),
    fromMe,
    token: body.token,
    baseUrl: body.BaseUrl,
    chatId: message.chatid ?? sender,
  }
}
