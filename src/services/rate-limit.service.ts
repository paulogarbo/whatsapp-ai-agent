import { redis } from '../lib/redis.js'

const RATE_LIMIT_MAX = 10
const RATE_LIMIT_WINDOW_SECONDS = 3600

export const rateLimitService = {
  async isAllowed(sender: string): Promise<boolean> {
    const key = `ratelimit:${sender}`
    const script = `
      local count = redis.call('INCR', KEYS[1])
      if count == 1 then
        redis.call('EXPIRE', KEYS[1], ARGV[1])
      end
      return count
    `
    const count = await redis.eval(
      script,
      1,
      key,
      String(RATE_LIMIT_WINDOW_SECONDS)
    ) as number

    return count <= RATE_LIMIT_MAX
  },
}
