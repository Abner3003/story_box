import { deliveryQueue } from '@storybox/queues'
import type { ListBooksQuery, ReviewBookBody, ListCollectionsQuery } from './admin.models.js'
import { listBooks, getBookById, updateBookStatus, listCollections } from './admin.repository.js'

const DEFAULT_LIMIT = 20

export async function getBooksPage(query: ListBooksQuery) {
  const limit = query.limit ?? DEFAULT_LIMIT
  const offset = ((query.page ?? 1) - 1) * limit
  return listBooks({ status: query.status, limit, offset })
}

export async function reviewBook(bookId: string, body: ReviewBookBody) {
  const book = await getBookById(bookId)
  if (!book) throw new Error('Book not found')

  const status = body.action === 'approve' ? 'approved' : 'rejected'

  await updateBookStatus(bookId, {
    status,
    reviewed_by: body.reviewed_by,
    reviewed_at: new Date().toISOString(),
    review_notes: body.notes,
  })

  if (status === 'approved') {
    await deliveryQueue.add('deliver-book', {
      bookId,
      childId: book.child_id,
      subscriberId: book.monthly_collections?.subscriber_id,
    })
  }
}

export async function getCollectionsPage(query: ListCollectionsQuery) {
  const limit = query.limit ?? DEFAULT_LIMIT
  const offset = ((query.page ?? 1) - 1) * limit
  return listCollections({ status: query.status, limit, offset })
}
