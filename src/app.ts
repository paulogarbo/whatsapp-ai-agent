import Fastify from 'fastify'

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

  return app
}
