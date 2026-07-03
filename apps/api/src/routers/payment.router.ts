import type { FastifyPluginAsync, FastifyRequest } from 'fastify'
import type { AbacatePayWebhookPayload } from '../modules/payment/payment.models.js'
import { handleAbacatePayWebhook } from '../modules/payment/payment.service.js'
import { isValidWebhookSignature, computeWebhookSignature } from '../modules/payment/webhook-signature.js'

interface RequestWithRawBody extends FastifyRequest {
  rawBody?: string
}

export const paymentRouter: FastifyPluginAsync = async (app) => {
  // Precisamos do corpo cru (string) pra validar o HMAC — o parser default
  // do Fastify já descarta isso depois de fazer o JSON.parse.
  app.addContentTypeParser('application/json', { parseAs: 'string' }, (req, body, done) => {
    ;(req as RequestWithRawBody).rawBody = body as string
    try {
      done(null, body ? JSON.parse(body as string) : {})
    } catch (err) {
      done(err as Error, undefined)
    }
  })

  app.post<{ Body: AbacatePayWebhookPayload }>('/webhook', {
    schema: {
      tags: ['Payment'],
      summary: 'Webhook da AbacatePay',
      body: { type: 'object' },
      response: {
        200: {
          type: 'object',
          properties: { status: { type: 'string', example: 'ok' } },
          required: ['status'],
        },
      },
    },
  }, async (req, reply) => {
    const secret = process.env.ABACATEPAY_WEBHOOK_SECRET
    if (!secret) {
      console.error('[abacatepay] ABACATEPAY_WEBHOOK_SECRET não configurado — recusando webhook')
      return reply.status(500).send({ status: 'ABACATEPAY_WEBHOOK_SECRET não configurado' })
    }

    const signature = req.headers['x-webhook-signature'] as string | undefined
    const rawBody = (req as RequestWithRawBody).rawBody ?? ''
    const valid = isValidWebhookSignature(rawBody, signature, secret)

    if (!valid) {
      const signatureHeaders = Object.entries(req.headers).filter(([key]) => key.toLowerCase().includes('signature'))
      console.warn(
        `[abacatepay] assinatura não bateu (modo diagnóstico, NÃO bloqueando por enquanto) — ` +
        `recebida="${signature}" esperada="${computeWebhookSignature(rawBody, secret)}" ` +
        `rawBodyLength=${rawBody.length} headersComSignature=${JSON.stringify(signatureHeaders)}`,
      )
      // TODO: voltar a bloquear (401) assim que confirmarmos o algoritmo/header certo com uma entrega real
    }

    await handleAbacatePayWebhook(req.body)
    return reply.status(200).send({ status: 'ok' })
  })
}
