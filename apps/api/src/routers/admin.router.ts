import type { FastifyPluginAsync } from 'fastify'
import type { ListBooksQuery, ReviewBookBody, ListCollectionsQuery, RegenerateBookBody } from '../modules/admin/admin.models.js'
import { getBooksPage, reviewBook, getCollectionsPage, regenerateBook } from '../modules/admin/admin.service.js'

const paginationQuerystring = {
  type: 'object',
  properties: {
    status: { type: 'string' },
    page:   { type: 'integer', minimum: 1 },
    limit:  { type: 'integer', minimum: 1 },
  },
} as const

export const adminRouter: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', async (req, reply) => {
    const apiKey = process.env.ADMIN_API_KEY
    if (!apiKey) {
      return reply.status(500).send({ error: 'ADMIN_API_KEY não configurado' })
    }
    if (req.headers['x-admin-key'] !== apiKey) {
      return reply.status(401).send({ error: 'Unauthorized' })
    }
  })

  app.get<{ Querystring: ListBooksQuery }>('/books', {
    schema: {
      tags: ['Admin'],
      summary: 'Lista livros para curadoria',
      querystring: paginationQuerystring,
      response: {
        200: { type: 'array', items: { type: 'object' } },
      },
    },
  }, async (req) => {
    return getBooksPage(req.query)
  })

  app.post<{ Params: { id: string }; Body: ReviewBookBody }>('/books/:id/review', {
    schema: {
      tags: ['Admin'],
      summary: 'Aprova ou rejeita um livro',
      params: {
        type: 'object',
        properties: { id: { type: 'string' } },
        required: ['id'],
      },
      body: {
        type: 'object',
        properties: {
          action:      { type: 'string', enum: ['approve', 'reject'] },
          notes:       { type: 'string' },
          reviewed_by: { type: 'string' },
        },
        required: ['action', 'reviewed_by'],
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
    await reviewBook(req.params.id, req.body)
    return reply.status(200).send({ status: 'ok' })
  })

  app.post<{ Params: { id: string }; Body: RegenerateBookBody }>('/books/:id/regenerate', {
    schema: {
      tags: ['Admin'],
      summary: 'Reenfileira a regeração de páginas de um livro (ou do livro inteiro, se nenhuma página for informada)',
      params: {
        type: 'object',
        properties: { id: { type: 'string' } },
        required: ['id'],
      },
      body: {
        type: 'object',
        properties: {
          pageNumbers: { type: 'array', items: { type: 'integer', minimum: 1 } },
          notes:       { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            status:      { type: 'string', example: 'ok' },
            pagesQueued: { type: 'integer' },
          },
          required: ['status', 'pagesQueued'],
        },
      },
    },
  }, async (req, reply) => {
    const { pagesQueued } = await regenerateBook(req.params.id, req.body)
    return reply.status(200).send({ status: 'ok', pagesQueued })
  })

  app.get<{ Querystring: ListCollectionsQuery }>('/collections', {
    schema: {
      tags: ['Admin'],
      summary: 'Lista colecoes mensais',
      querystring: paginationQuerystring,
      response: {
        200: { type: 'array', items: { type: 'object' } },
      },
    },
  }, async (req) => {
    return getCollectionsPage(req.query)
  })
}
