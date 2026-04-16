export type ContentType = 'text' | 'audio' | 'image' | 'video' | 'document' | 'unknown'

export interface NormalizedMessage {
  readonly id: string
  readonly sender: string
  readonly senderName: string
  readonly message: string
  readonly messageTimestamp: number
  readonly content_type: ContentType
  readonly fromMe: boolean
  readonly token: string
  readonly baseUrl: string
  readonly chatId: string  // group ID for group chats, same as sender for 1:1
}
