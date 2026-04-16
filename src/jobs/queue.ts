import { Queue } from 'bullmq'
import Redis from 'ioredis'
import { redisOptions } from '../lib/redis.js'

// BullMQ requires maxRetriesPerRequest: null
const connection = new Redis({ ...redisOptions, maxRetriesPerRequest: null })

export interface MessageJob {
  sender: string
  token: string
}

export const messageQueue = new Queue('messages', { connection })
