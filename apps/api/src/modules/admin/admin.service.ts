import { deliveryQueue, regenQueue } from '@storybox/queues'
import type { StoryJSON } from '@storybox/db'
import type { ListBooksQuery, ReviewBookBody, ListCollectionsQuery, RegenerateBookBody } from './admin.models.js'
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

export async function regenerateBook(bookId: string, body: RegenerateBookBody) {
  const book = await getBookById(bookId)
  if (!book) throw new Error('Book not found')

  const allPages = (book.story_json as StoryJSON | null)?.pages ?? []
  const pageNumbers = body.pageNumbers?.length ? body.pageNumbers : allPages.map((page) => page.page_number)

  if (!pageNumbers.length) throw new Error('Livro não tem páginas para regerar')

  await Promise.all(
    pageNumbers.map((pageNumber) =>
      regenQueue.add('regenerate-page', { bookId, pageNumber, notes: body.notes }),
    ),
  )

  await updateBookStatus(bookId, { status: 'generating_images' })

  return { pagesQueued: pageNumbers.length }
}

export async function getCollectionsPage(query: ListCollectionsQuery) {
  const limit = query.limit ?? DEFAULT_LIMIT
  const offset = ((query.page ?? 1) - 1) * limit
  return listCollections({ status: query.status, limit, offset })
}
