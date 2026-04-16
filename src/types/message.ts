export type ContentType = 'text' | 'audio' | 'image' | 'video' | 'document' | 'unknown'

export interface NormalizedMessage {
  id: string
  sender: string
  senderName: string
  message: string
  messageTimestamp: number
  content_type: ContentType
  fromMe: boolean
  token: string
  baseUrl: string
}
