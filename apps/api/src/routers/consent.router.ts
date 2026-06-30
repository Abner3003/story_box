import type { FastifyPluginAsync } from 'fastify'
import type { GrantConsentBody } from '../modules/consent/consent.models.js'
import { processConsent, getConsentStatus } from '../modules/consent/consent.service.js'

export const consentRouter: FastifyPluginAsync = async (app) => {
  app.post<{ Body: GrantConsentBody }>('/', {
    schema: {
      tags: ['Consent'],
      summary: 'Registra a decisao de consentimento',
      body: {
        type: 'object',
        properties: {
          token:    { type: 'string' },
          accepted: { type: 'boolean' },
        },
        required: ['token', 'accepted'],
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
    await processConsent(req.body)
    return reply.status(200).send({ status: 'ok' })
  })

  app.get<{ Params: { childId: string } }>('/:childId', {
    schema: {
      tags: ['Consent'],
      summary: 'Consulta o status de consentimento do child',
      params: {
        type: 'object',
        properties: { childId: { type: 'string' } },
        required: ['childId'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            childId:      { type: 'string' },
            imageConsent: { type: 'boolean' },
            consentAt:    { type: 'string', format: 'date-time', nullable: true },
          },
          required: ['childId', 'imageConsent'],
        },
      },
    },
  }, async (req) => {
    return getConsentStatus(req.params.childId)
  })
}
