import Fastify from 'fastify'
import { webhookRoute } from './routes/webhook.route.js'

export function buildApp() {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL ?? 'info',
      transport:
        process.env.NODE_ENV !== 'production'
          ? { target: 'pino-pretty' }
          : undefined,
    },
  })

  app.get('/health', async () => ({ status: 'ok' }))
  app.register(webhookRoute)

  return app
}
