import type { FastifyPluginAsync } from 'fastify'
import type { AbacatePayWebhookPayload } from '../modules/payment/payment.models.js'
import { handleAbacatePayWebhook } from '../modules/payment/payment.service.js'

export const paymentRouter: FastifyPluginAsync = async (app) => {
  app.post<{ Body: AbacatePayWebhookPayload }>('/webhook', {
    schema: {
      tags: ['Payment'],
      summary: 'Webhook da AbacatePay',
      body: {
        type: 'object',
        properties: {
          event: {
            type: 'string',
            enum: ['billing.paid', 'billing.expired', 'billing.cancelled', 'billing.refunded'],
          },
          data: {
            type: 'object',
            properties: {
              billing: {
                type: 'object',
                properties: {
                  id:       { type: 'string' },
                  customer: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
                  amount:   { type: 'number' },
                  status:   { type: 'string' },
                  metadata: { type: 'object', additionalProperties: { type: 'string' } },
                },
                required: ['id', 'customer', 'amount', 'status'],
              },
            },
            required: ['billing'],
          },
        },
        required: ['event', 'data'],
      },
      response: {
        200: {
          type: 'object',
          properties: { status: { type: 'string', example: 'ok' } },
          required: ['status'],
        },
      },
    },
  }, async (req, reply) => {
    await handleAbacatePayWebhook(req.body)
    return reply.status(200).send({ status: 'ok' })
  })
}
