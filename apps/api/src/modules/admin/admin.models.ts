import type { BookStatus, CollectionStatus } from '@storybox/db'

export interface ListBooksQuery {
  status?: BookStatus
  page?: number
  limit?: number
}

export interface AdminBookSummary {
  id: string
  status: BookStatus
  title?: string
  childName?: string
  referenceMonth?: string
  pdfUrl?: string | null
  coverImageUrl?: string | null
  reviewedBy?: string
  reviewedAt?: string
  reviewNotes?: string
  createdAt: string
  updatedAt: string
}

export interface AdminBookDetail extends AdminBookSummary {
  collectionId: string
  childId: string
  storyJson?: {
    title: string
    moral: string
    pages: Array<{
      page_number: number
      text: string
      illustration_prompt: string
      image_storage_path?: string
      imageUrl?: string | null
    }>
  }
}

export interface ReviewBookBody {
  action: 'approve' | 'reject'
  notes?: string
  reviewed_by: string
}

export interface ListCollectionsQuery {
  status?: CollectionStatus
  page?: number
  limit?: number
}

export interface RegenerateBookBody {
  pageNumbers?: number[]
  notes?: string
}

export interface UpdateBookBody {
  title?: string
  reviewNotes?: string
}
