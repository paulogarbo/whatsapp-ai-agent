import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { webhookController } from '../controllers/webhook.controller.js'

async function authenticateWebhook(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const body = request.body as Record<string, unknown> | undefined
  if (body?.token !== process.env.UAZAPI_WEBHOOK_SECRET) {
    await reply.status(401).send({ ok: false, reason: 'unauthorized' })
  }
}

export async function webhookRoute(app: FastifyInstance): Promise<void> {
  app.post('/gerar-resposta/agente-ai', {
    preHandler: authenticateWebhook,
  }, webhookController)
}
