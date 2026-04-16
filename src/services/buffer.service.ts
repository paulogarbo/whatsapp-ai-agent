import { redis } from '../lib/redis.js'
import { messageQueue } from '../jobs/queue.js'
import type { NormalizedMessage } from '../types/message.js'

const DEBOUNCE_DELAY_MS = 9000
const JOB_ID_PREFIX = 'buffer'

export const bufferService = {
  async push(sender: string, message: NormalizedMessage): Promise<void> {
    await redis.rpush(sender, JSON.stringify(message))
  },

  async schedule(sender: string): Promise<void> {
    const jobId = `${JOB_ID_PREFIX}:${sender}`

    const existing = await messageQueue.getJob(jobId)
    if (existing) {
      await existing.remove()
    }

    await messageQueue.add('process', { sender }, { delay: DEBOUNCE_DELAY_MS, jobId })
  },

  async flush(sender: string): Promise<NormalizedMessage[]> {
    const items = await redis.lrange(sender, 0, -1)
    await redis.del(sender)
    return items.map((item) => JSON.parse(item) as NormalizedMessage)
  },
}
