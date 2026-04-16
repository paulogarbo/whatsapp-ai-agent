import Redis from 'ioredis'

function parseRedisUrl(url: string) {
  const parsed = new URL(url)
  return {
    host: parsed.hostname,
    port: Number(parsed.port) || 6379,
    password: parsed.password || undefined,
  }
}

export const redisOptions = parseRedisUrl(
  process.env.REDIS_URL ?? 'redis://localhost:6379'
)

// General purpose client — fails fast (maxRetriesPerRequest: 3 default)
export const redis = new Redis(redisOptions)
