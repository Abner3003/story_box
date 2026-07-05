import type { FastifyPluginAsync } from 'fastify'
import type {
  ListBooksQuery,
  ReviewBookBody,
  ListCollectionsQuery,
  RegenerateBookBody,
  UpdateBookBody,
} from '../modules/admin/admin.models.js'
import { getBooksPage, getBookDetail, reviewBook, getCollectionsPage, regenerateBook, editBook } from '../modules/admin/admin.service.js'

const paginationQuerystring = {
  type: 'object',
  properties: {
    status: { type: 'string' },
    page:   { type: 'integer', minimum: 1 },
    limit:  { type: 'integer', minimum: 1 },
  },
} as const

// O Fastify serializa a resposta pelo schema declarado abaixo — qualquer
// campo que não esteja listado aqui é silenciosamente descartado, mesmo que
// o service retorne o valor certo. Por isso precisa listar tudo que
// AdminBookSummary/AdminBookDetail (admin.models.ts) realmente têm.
const bookSummarySchema = {
  type: 'object',
  properties: {
    id:             { type: 'string' },
    status:         { type: 'string' },
    title:          { type: 'string' },
    childName:      { type: 'string' },
    referenceMonth: { type: 'string' },
    pdfUrl:         { type: ['string', 'null'] },
    reviewedBy:     { type: 'string' },
    reviewedAt:     { type: 'string' },
    reviewNotes:    { type: 'string' },
    createdAt:      { type: 'string' },
    updatedAt:      { type: 'string' },
  },
} as const

const bookDetailSchema = {
  type: 'object',
  properties: {
    ...bookSummarySchema.properties,
    collectionId: { type: 'string' },
    childId:      { type: 'string' },
    storyJson: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        moral: { type: 'string' },
        pages: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              page_number:         { type: 'integer' },
              text:                { type: 'string' },
              illustration_prompt: { type: 'string' },
              image_storage_path:  { type: 'string' },
            },
          },
        },
      },
    },
  },
} as const

const collectionSummarySchema = {
  type: 'object',
  additionalProperties: true,
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
      security: [{ adminApiKey: [] }],
      summary: 'Lista livros para curadoria',
      querystring: paginationQuerystring,
      response: {
        200: { type: 'array', items: bookSummarySchema },
      },
    },
  }, async (req) => {
    return getBooksPage(req.query)
  })

  app.get<{ Params: { id: string } }>('/books/:id', {
    schema: {
      tags: ['Admin'],
      security: [{ adminApiKey: [] }],
      summary: 'Detalhe de um livro para revisão',
      params: {
        type: 'object',
        properties: { id: { type: 'string' } },
        required: ['id'],
      },
      response: {
        200: bookDetailSchema,
      },
    },
  }, async (req) => {
    return getBookDetail(req.params.id)
  })

  app.patch<{ Params: { id: string }; Body: UpdateBookBody }>('/books/:id', {
    schema: {
      tags: ['Admin'],
      security: [{ adminApiKey: [] }],
      summary: 'Atualiza metadados editáveis de um livro',
      params: {
        type: 'object',
        properties: { id: { type: 'string' } },
        required: ['id'],
      },
      body: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          reviewNotes: { type: 'string' },
        },
      },
      response: {
        200: bookDetailSchema,
      },
    },
  }, async (req) => {
    return editBook(req.params.id, req.body)
  })

  app.get<{ Params: { id: string } }>('/books/:id/pdf-url', {
    schema: {
      tags: ['Admin'],
      security: [{ adminApiKey: [] }],
      summary: 'URL assinada para download do PDF',
      params: {
        type: 'object',
        properties: { id: { type: 'string' } },
        required: ['id'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            url: { type: ['string', 'null'] },
          },
          required: ['url'],
        },
      },
    },
  }, async (req) => {
    const book = await getBookDetail(req.params.id)
    if (!book.pdfUrl) {
      return { url: null }
    }
    return { url: book.pdfUrl }
  })

  app.post<{ Params: { id: string }; Body: ReviewBookBody }>('/books/:id/review', {
    schema: {
      tags: ['Admin'],
      security: [{ adminApiKey: [] }],
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
      security: [{ adminApiKey: [] }],
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
      security: [{ adminApiKey: [] }],
      summary: 'Lista colecoes mensais',
      querystring: paginationQuerystring,
      response: {
        200: { type: 'array', items: collectionSummarySchema },
      },
    },
  }, async (req) => {
    return getCollectionsPage(req.query)
  })
}
