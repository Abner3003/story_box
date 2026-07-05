import { deliveryQueue, regenQueue } from '@storybox/queues'
import type { StoryJSON } from '@storybox/db'
import type {
  AdminBookDetail,
  AdminBookSummary,
  ListBooksQuery,
  ReviewBookBody,
  ListCollectionsQuery,
  RegenerateBookBody,
  UpdateBookBody,
} from './admin.models.js'
import { listBooks, getBookById, updateBookStatus, updateBook, listCollections } from './admin.repository.js'
import { getSignedAssetUrl } from '../delivery/delivery.repository.js'

const DEFAULT_LIMIT = 20

type RawBook = Awaited<ReturnType<typeof listBooks>>[number] & {
  children?: { name?: string }
  monthly_collections?: { reference_month?: string }
}

async function mapBookSummary(book: RawBook): Promise<AdminBookSummary> {
  return {
    id: book.id,
    status: book.status,
    title: book.title ?? undefined,
    childName: book.children?.name ?? undefined,
    referenceMonth: book.monthly_collections?.reference_month ?? undefined,
    pdfUrl: book.pdf_storage_path ? await getSignedAssetUrl(book.pdf_storage_path) : null,
    coverImageUrl: book.cover_image_storage_path ? await getSignedAssetUrl(book.cover_image_storage_path) : null,
    reviewedBy: book.reviewed_by ?? undefined,
    reviewedAt: book.reviewed_at ?? undefined,
    reviewNotes: book.review_notes ?? undefined,
    createdAt: book.created_at,
    updatedAt: book.updated_at,
  }
}

async function mapBookDetail(book: Awaited<ReturnType<typeof getBookById>>): Promise<AdminBookDetail> {
  const summary = await mapBookSummary(book as RawBook)
  const storyJson = book.story_json as AdminBookDetail['storyJson']

  const pages = storyJson
    ? await Promise.all(
        storyJson.pages.map(async (page) => ({
          ...page,
          imageUrl: page.image_storage_path ? await getSignedAssetUrl(page.image_storage_path) : null,
        })),
      )
    : undefined

  return {
    ...summary,
    collectionId: book.collection_id,
    childId: book.child_id,
    storyJson: storyJson ? { ...storyJson, pages: pages! } : undefined,
  }
}

export async function getBooksPage(query: ListBooksQuery) {
  const limit = query.limit ?? DEFAULT_LIMIT
  const offset = ((query.page ?? 1) - 1) * limit
  const books = await listBooks({ status: query.status, limit, offset })
  return Promise.all(books.map((book) => mapBookSummary(book as RawBook)))
}

export async function getBookDetail(bookId: string) {
  const book = await getBookById(bookId)
  if (!book) throw new Error('Book not found')
  return mapBookDetail(book)
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

export async function editBook(bookId: string, body: UpdateBookBody) {
  const book = await getBookById(bookId)
  if (!book) throw new Error('Book not found')

  const updated = await updateBook(bookId, {
    title: body.title?.trim() || undefined,
    review_notes: body.reviewNotes?.trim() || undefined,
  })

  return mapBookDetail(updated as Awaited<ReturnType<typeof getBookById>>)
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
