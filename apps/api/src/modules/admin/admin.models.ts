import type { BookStatus, CollectionStatus } from '@storybox/db'

export interface ListBooksQuery {
  status?: BookStatus
  page?: number
  limit?: number
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
