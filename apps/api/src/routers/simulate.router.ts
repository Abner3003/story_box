import type { FastifyPluginAsync } from 'fastify'
import multipart from '@fastify/multipart'
import { randomUUID } from 'node:crypto'
import type { WhatsAppWebhookPayload } from '../modules/webhook/webhook.models.js'
import { handleWhatsAppWebhook } from '../modules/webhook/webhook.service.js'
import { resumeOnboarding } from '../modules/onboarding/onboarding.service.js'
import { setInterceptor, type OutboundMessage } from '../lib/whatsapp.js'
import { storeSimulatedMedia } from '../lib/simulate-media.js'
import { metaObjectBodySchema } from '../schemas.js'

export const simulateRouter: FastifyPluginAsync = async (app) => {
  await app.register(multipart)

  app.post('/photo', {
    validatorCompiler: () => () => true,  // pula validação JSON — body é multipart
    schema: {
      tags: ['Simulate'],
      summary: 'Simula o envio de uma foto no WhatsApp',
      description:
        'Faz upload de uma imagem real, armazena em memória e retoma o flow LangGraph ' +
        'como se o usuário tivesse enviado a foto via WhatsApp. GPT-4o Vision roda de verdade.',
      consumes: ['multipart/form-data'],
      body: {
        type: 'object',
        required: ['phone'],
        properties: {
          phone: { type: 'string', description: 'Telefone no formato +5511988887777' },
          image: { type: 'string', format: 'binary', description: 'Arquivo de imagem (jpg/png)' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            messages: { type: 'array', items: { type: 'object' } },
          },
        },
      },
    },
  }, async (req, reply) => {
    const parts = req.parts()
    let phone = ''
    let imageBase64 = ''
    let mimeType = 'image/jpeg'

    for await (const part of parts) {
      if (part.type === 'field' && part.fieldname === 'phone') {
        phone = part.value as string
      } else if (part.type === 'file' && part.fieldname === 'image') {
        mimeType = part.mimetype
        const chunks: Buffer[] = []
        for await (const chunk of part.file) chunks.push(chunk as Buffer)
        imageBase64 = Buffer.concat(chunks).toString('base64')
      }
    }

    if (!phone) return reply.status(400).send({ error: 'Campo phone obrigatório' })
    if (!imageBase64) return reply.status(400).send({ error: 'Campo image obrigatório' })

    const simId = `sim:${randomUUID()}`
    storeSimulatedMedia(simId, { base64: imageBase64, mimeType })

    const captured: OutboundMessage[] = []
    setInterceptor((msg) => captured.push(msg))

    try {
      await resumeOnboarding(phone, `[image:${simId}]`, { simulate: true })
    } finally {
      setInterceptor(null)
    }

    return reply.send({ messages: captured })
  })

  app.post<{ Body: WhatsAppWebhookPayload }>('/message', {
    schema: {
      tags: ['Simulate'],
      summary: 'Simula um evento WhatsApp e devolve as mensagens que seriam enviadas',
      description:
        'Roda o flow LangGraph completo sem chamar a API da Meta. ' +
        'Útil para testar localmente sem token do WhatsApp configurado.',
      body: metaObjectBodySchema,
      response: {
        200: {
          type: 'object',
          required: ['messages'],
          properties: {
            messages: {
              type: 'array',
              items: {
                type: 'object',
                required: ['type', 'to'],
                properties: {
                  type: { type: 'string', enum: ['text', 'video', 'buttons'] },
                  to:   { type: 'string' },
                  body: { type: 'string' },
                  link: { type: 'string' },
                  caption: { type: 'string' },
                  buttons: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id:    { type: 'string' },
                        title: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  }, async (req, reply) => {
    const captured: OutboundMessage[] = []
    setInterceptor((msg) => captured.push(msg))

    try {
      await handleWhatsAppWebhook(req.body, { simulate: true })
    } finally {
      setInterceptor(null)
    }

    return reply.send({ messages: captured })
  })
}
