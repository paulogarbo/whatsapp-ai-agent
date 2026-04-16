import type { FastifyInstance } from 'fastify'
import { webhookController } from '../controllers/webhook.controller.js'

export async function webhookRoute(app: FastifyInstance): Promise<void> {
  app.post('/gerar-resposta/agente-ai', webhookController)
}
