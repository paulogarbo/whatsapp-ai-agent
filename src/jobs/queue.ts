import { Queue } from 'bullmq'
import { redis } from '../lib/redis.js'

export const messageQueue = new Queue('messages', {
  connection: redis,
})
