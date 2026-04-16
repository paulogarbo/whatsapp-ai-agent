import { z } from 'zod'

const MessageContentSchema = z.object({
  mimetype: z.string().optional(),
})

export const WebhookBodySchema = z.object({
  token: z.string(),
  BaseUrl: z.string(),
  message: z.object({
    id: z.string(),
    sender: z.string(),
    sender_pn: z.string().optional(),
    senderName: z.string().optional(),
    content: z.union([z.string(), MessageContentSchema]).optional(),
    messageTimestamp: z.union([z.string(), z.number()]),
    type: z.string().optional(),
    mediaType: z.string().optional(),
    fromMe: z.union([z.boolean(), z.string()]).optional(),
    chatid: z.string().optional(),
  }),
})

export type WebhookBody = z.infer<typeof WebhookBodySchema>
