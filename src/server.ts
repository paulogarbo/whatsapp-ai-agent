import 'dotenv/config'
import './lib/env.js'
import { buildApp } from './app.js'
import { messageWorker } from './jobs/worker.js'
import { messageQueue } from './jobs/queue.js'
import { redis } from './lib/redis.js'

const app = buildApp()

const start = async () => {
  try {
    await app.listen({ port: Number(process.env.PORT ?? 3000), host: '0.0.0.0' })
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()

const shutdown = async () => {
  app.log.info('Shutting down...')
  await messageWorker.close()
  await messageQueue.close()
  await redis.quit()
  await app.close()
  process.exit(0)
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
