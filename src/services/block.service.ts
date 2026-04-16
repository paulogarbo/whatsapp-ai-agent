import { redis } from '../lib/redis.js'

const BLOCK_TTL_SECONDS = 300

export const blockService = {
  async setBlock(chatId: string): Promise<void> {
    await redis.set(`${chatId}_block`, 'true', 'EX', BLOCK_TTL_SECONDS)
  },

  async isBlocked(chatId: string): Promise<boolean> {
    const value = await redis.get(`${chatId}_block`)
    return value !== null
  },
}
