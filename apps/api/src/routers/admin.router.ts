import type { FastifyPluginAsync } from 'fastify'
import type { ListBooksQuery, ReviewBookBody, ListCollectionsQuery } from '../modules/admin/admin.models.js'
import { getBooksPage, reviewBook, getCollectionsPage } from '../modules/admin/admin.service.js'

const paginationQuerystring = {
  type: 'object',
  properties: {
    status: { type: 'string' },
    page:   { type: 'integer', minimum: 1 },
    limit:  { type: 'integer', minimum: 1 },
  },
} as const

export const adminRouter: FastifyPluginAsync = async (app) => {
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
