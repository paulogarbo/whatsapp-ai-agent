import { Worker } from 'bullmq'
import Redis from 'ioredis'
import { redisOptions } from '../lib/redis.js'
import type { MessageJob } from './queue.js'
import { logger } from '../lib/logger.js'
import { bufferService } from '../services/buffer.service.js'
import { mediaService } from '../services/media.service.js'
import { agentService } from '../services/agent.service.js'
import { ttsService } from '../services/tts.service.js'
import { whatsappService } from '../services/whatsapp.service.js'

// BullMQ requires maxRetriesPerRequest: null
const connection = new Redis({ ...redisOptions, maxRetriesPerRequest: null })

export const messageWorker = new Worker<MessageJob>(
  'messages',
  async (job) => {
    const { sender: chatId, token } = job.data

    const messages = await bufferService.flush(chatId)
    if (messages.length === 0) return

    const resolved = await Promise.all(
      messages.map(async (m) => {
        if (m.content_type === 'audio') {
          const transcribed = await mediaService.downloadAndTranscribeAudio({
            messageId: m.id,
            baseUrl: m.baseUrl,
            token,
          })
          return { ...m, message: transcribed, content_type: 'text' as const }
        }
        return m
      })
    )

    const context = resolved.map((m) => m.message).join('\n')

    const result = await agentService.run(chatId, context)
    logger.info({ output: result.output, content_type: result.content_type }, 'agentService.run result')

    const lines = result.output.replace(/\\n/g, '\n').split(/\r?\n/).filter((line) => line.trim() !== '')

    const sendParams = { token, number: chatId }

    if (result.content_type === 'audio') {
      logger.info({ content_type: result.content_type }, 'taking audio path')
      const audioBase64List = await Promise.all(
        lines.map(async (line) => {
          logger.info({ line }, 'sending line to ttsService.synthesize')
          const audioBase64 = await ttsService.synthesize(line)
          logger.info({ length: audioBase64.length }, 'ttsService.synthesize result')
          return audioBase64
        })
      )
      logger.info({ sendParams, audioCount: audioBase64List.length }, 'calling whatsappService.sendAudioMessages')
      await whatsappService.sendAudioMessages(sendParams, audioBase64List)
    } else {
      logger.info({ content_type: result.content_type }, 'taking text path')
      await whatsappService.sendTextMessages(sendParams, lines)
    }
  },
  {
    connection,
    concurrency: 5,
  }
)

messageWorker.on('completed', (job) => {
  logger.info({ jobId: job.id, sender: job.data.sender }, 'job completed')
})

messageWorker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, sender: job?.data.sender, err }, 'job failed')
})
