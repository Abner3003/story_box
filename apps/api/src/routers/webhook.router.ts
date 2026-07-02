import type { FastifyPluginAsync } from 'fastify'
import type { WhatsAppWebhookPayload } from '../modules/webhook/webhook.models.js'
import { handleWhatsAppWebhook } from '../modules/webhook/webhook.service.js'
import { metaObjectBodySchema, webhookResponseSchema } from '../schemas.js'

function verifyToken() {
  return process.env.META_VERIFY_TOKEN ?? process.env.WHATSAPP_VERIFY_TOKEN
}

export const webhookRouter: FastifyPluginAsync = async (app) => {
  app.get<{ Querystring: { 'hub.mode': string; 'hub.verify_token': string; 'hub.challenge': string } }>(
    '/',
    {
      schema: {
        tags: ['Webhook'],
        summary: 'Verificação do webhook da Meta WhatsApp',
        querystring: {
          type: 'object',
          properties: {
            'hub.mode':         { type: 'string' },
            'hub.verify_token': { type: 'string' },
            'hub.challenge':    { type: 'string' },
          },
          required: ['hub.mode', 'hub.verify_token', 'hub.challenge'],
        },
        response: {
          200: { type: 'string' },
          403: {
            type: 'object',
            properties: { error: { type: 'string' } },
            required: ['error'],
          },
        },
      },
    },
    async (req, reply) => {
      const mode      = req.query['hub.mode']
      const token     = req.query['hub.verify_token']
      const challenge = req.query['hub.challenge']

      if (mode === 'subscribe' && token === verifyToken()) {
        return reply.send(challenge)
      }
      return reply.status(403).send({ error: 'Forbidden' })
    }
  )

  app.post<{ Body: WhatsAppWebhookPayload }>('/', {
    schema: {
      tags: ['Webhook'],
      summary: 'Recebe eventos da WhatsApp Cloud API',
      body: metaObjectBodySchema,
      response: {
        200: webhookResponseSchema,
      },
    },
  }, async (req, reply) => {
    await handleWhatsAppWebhook(req.body)
    return reply.status(200).send({ received: true })
  })
}
