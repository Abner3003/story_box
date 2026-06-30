import Fastify from 'fastify'
import cors from '@fastify/cors'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import 'dotenv/config'

import { webhookRouter }  from './routers/webhook.router.js'
import { adminRouter }    from './routers/admin.router.js'
import { paymentRouter }  from './routers/payment.router.js'
import { consentRouter }  from './routers/consent.router.js'
import { simulateRouter } from './routers/simulate.router.js'

const app = Fastify({
  logger: true,
  ajv: { customOptions: { keywords: ['example'] } },
})
console.log('teste git')
await app.register(cors, { origin: true })

await app.register(swagger, {
  openapi: {
    info: {
      title: 'StoryBox API',
      version: '0.0.1',
      description: 'Documentação da API do StoryBox.',
    },
    tags: [
      { name: 'Health' },
      { name: 'Webhook' },
      { name: 'Admin' },
      { name: 'Payment' },
      { name: 'Consent' },
      { name: 'Simulate' },
    ],
  },
})

await app.register(swaggerUi, {
  routePrefix: '/docs',
})

await app.register(webhookRouter,  { prefix: '/webhook'  })
await app.register(adminRouter,    { prefix: '/admin'    })
await app.register(paymentRouter,  { prefix: '/payment'  })
await app.register(consentRouter,  { prefix: '/consent'  })
await app.register(simulateRouter, { prefix: '/simulate' })

app.get('/', {
  schema: {
    tags: ['Health'],
    summary: 'Root',
    response: {
      200: {
        type: 'object',
        properties: {
          name:    { type: 'string' },
          version: { type: 'string' },
          docs:    { type: 'string' },
        },
      },
    },
  },
}, async () => ({ name: 'StoryBox API', version: '0.0.1', docs: '/docs' }))

app.get('/health', {
  schema: {
    tags: ['Health'],
    summary: 'Health check',
    response: {
      200: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'ok' },
          ts:     { type: 'string', format: 'date-time' },
        },
        required: ['status', 'ts'],
      },
    },
  },
}, async () => ({ status: 'ok', ts: new Date().toISOString() }))

const PORT = Number(process.env.PORT ?? 3001)

try {
  await app.listen({ port: PORT, host: '0.0.0.0' })
  console.log(`StoryBox API rodando na porta ${PORT}`)
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
