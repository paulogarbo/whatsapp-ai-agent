import { Worker } from 'bullmq'
import { redis } from '../lib/redis.js'
import { logger } from '../lib/logger.js'
import { bufferService } from '../services/buffer.service.js'
import { mediaService } from '../services/media.service.js'
import { agentService } from '../services/agent.service.js'
import { ttsService } from '../services/tts.service.js'
import { whatsappService } from '../services/whatsapp.service.js'

interface MessageJob {
  sender: string
  token: string
}

export const messageWorker = new Worker<MessageJob>(
  'messages',
  async (job) => {
    const { sender, token } = job.data

    const messages = await bufferService.flush(sender)
    if (messages.length === 0) return

    for (const m of messages) {
      if (m.content_type === 'audio') {
        m.message = await mediaService.downloadAndTranscribeAudio({
          messageId: m.id,
          baseUrl: m.baseUrl,
          token: token,
        })
        m.content_type = 'text'
      }
    }

    const context = messages.map((m) => m.message).join('\n')

    const result = await agentService.run(sender, context)

    const lines = result.output.split(/\r?\n/).filter((line) => line.trim() !== '')

    const sendParams = { token, number: sender }

    if (result.content_type === 'audio') {
      const audioBase64List = await Promise.all(lines.map((line) => ttsService.synthesize(line)))
      await whatsappService.sendAudioMessages(sendParams, audioBase64List)
    } else {
      await whatsappService.sendTextMessages(sendParams, lines)
    }
  },
  {
    connection: redis,
    concurrency: 5,
  }
)

messageWorker.on('completed', (job) => {
  logger.info({ jobId: job.id, sender: job.data.sender }, 'job completed')
})

messageWorker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, sender: job?.data.sender, err }, 'job failed')
})
