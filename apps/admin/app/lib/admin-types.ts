export type BookStatus =
  | 'pending'
  | 'generating_text'
  | 'generating_images'
  | 'assembling'
  | 'ready_for_review'
  | 'approved'
  | 'rejected'
  | 'delivered_digital'
  | 'sent_to_print'
  | 'delivered_physical'

export type StoryPage = {
  page_number: number
  text: string
  illustration_prompt: string
  image_storage_path?: string
}

export type AdminBookSummary = {
  id: string
  status: BookStatus
  title?: string
  childName?: string
  referenceMonth?: string
  pdfUrl?: string | null
  reviewedBy?: string
  reviewedAt?: string
  reviewNotes?: string
  createdAt: string
  updatedAt: string
}

export type AdminBookDetail = AdminBookSummary & {
  collectionId: string
  childId: string
  storyJson?: {
    title: string
    moral: string
    pages: StoryPage[]
  }
}

export type ListBooksQuery = {
  status?: BookStatus
  page?: number
  limit?: number
}

export type ReviewBookBody = {
  action: 'approve' | 'reject'
  notes?: string
  reviewed_by: string
}

export type UpdateBookBody = {
  title?: string
  reviewNotes?: string
}

