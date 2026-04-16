import type { FastifyRequest, FastifyReply } from 'fastify'
import { WebhookBodySchema } from '../schemas/webhook.schema.js'
import { normalizeMessage } from '../services/normalizer.service.js'
import { blockService } from '../services/block.service.js'
import { bufferService } from '../services/buffer.service.js'
import { customerService } from '../services/customer.service.js'
import { mediaService } from '../services/media.service.js'
import { logger } from '../lib/logger.js'

export async function webhookController(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const parsed = WebhookBodySchema.safeParse(request.body)
    if (!parsed.success) {
      logger.warn({ errors: parsed.error.errors }, 'invalid webhook payload')
      await reply.status(400).send({ ok: false, reason: 'invalid_payload' })
      return
    }

    const body = parsed.data
    const msg = normalizeMessage(body)

    if (msg.fromMe) {
      await blockService.setBlock(body.message.chatid ?? msg.sender)
      await reply.status(200).send({ ok: true, reason: 'blocked' })
      return
    }

    const isBlocked = await blockService.isBlocked(msg.sender)
    if (isBlocked) {
      await reply.status(200).send({ ok: true, reason: 'ignored' })
      return
    }

    if (
      msg.content_type === 'image' ||
      msg.content_type === 'video' ||
      msg.content_type === 'document' ||
      msg.content_type === 'unknown'
    ) {
      logger.info({ sender: msg.sender, content_type: msg.content_type }, 'unsupported media type')
      await reply.status(200).send({ ok: true, reason: 'unsupported' })
      return
    }

    if (msg.content_type === 'audio') {
      const transcription = await mediaService.downloadAndTranscribeAudio({
        messageId: msg.id,
        baseUrl: body.BaseUrl,
        token: msg.token,
      })
      msg.message = transcription
      msg.content_type = 'text'
    }

    await customerService.upsert(msg)
    await bufferService.push(msg.sender, msg)
    await bufferService.schedule(msg.sender, msg.token)

    await reply.status(200).send({ ok: true })
  } catch (err) {
    logger.error({ err }, 'webhook controller error')
    await reply.status(500).send({ ok: false })
  }
}
