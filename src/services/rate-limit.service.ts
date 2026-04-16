import { redis } from '../lib/redis.js'

const RATE_LIMIT_MAX = 10
const RATE_LIMIT_WINDOW_SECONDS = 3600

export const rateLimitService = {
  async isAllowed(sender: string): Promise<boolean> {
    const key = `ratelimit:${sender}`
    const count = await redis.incr(key)
    if (count === 1) {
      await redis.expire(key, RATE_LIMIT_WINDOW_SECONDS)
    }
    return count <= RATE_LIMIT_MAX
  },
}
