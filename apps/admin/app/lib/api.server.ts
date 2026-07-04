type AdminEnv = {
  API_PUBLIC_URL?: string
  PUBLIC_API_URL?: string
  ADMIN_API_KEY?: string
  ADMIN_REVIEWER_NAME?: string
}

type LoadContext = {
  cloudflare?: {
    env?: AdminEnv
  }
}

function getEnvValue(context?: LoadContext) {
  const runtimeEnv = context?.cloudflare?.env ?? {}

  return {
    apiBaseUrl:
      runtimeEnv.API_PUBLIC_URL ??
      runtimeEnv.PUBLIC_API_URL ??
      process.env.API_PUBLIC_URL ??
      process.env.PUBLIC_API_URL ??
      'http://localhost:3001',
    adminApiKey: runtimeEnv.ADMIN_API_KEY ?? process.env.ADMIN_API_KEY ?? '',
    reviewerName: runtimeEnv.ADMIN_REVIEWER_NAME ?? process.env.ADMIN_REVIEWER_NAME ?? 'Admin Portal',
  }
}

async function apiFetch<T>(path: string, init: RequestInit = {}, context?: LoadContext): Promise<T> {
  const { apiBaseUrl, adminApiKey } = getEnvValue(context)
  if (!adminApiKey) {
    throw new Error('ADMIN_API_KEY is required for the admin portal')
  }
  const headers = new Headers(init.headers)
  headers.set('x-admin-key', adminApiKey)

  if (!headers.has('content-type') && init.body) {
    headers.set('content-type', 'application/json')
  }

  const response = await fetch(new URL(path, apiBaseUrl).toString(), {
    ...init,
    headers,
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Response(message || 'Request failed', { status: response.status })
  }

  return response.json() as Promise<T>
}

export function getReviewerName(context?: LoadContext) {
  return getEnvValue(context).reviewerName
}

export async function listBooks(page: number, limit: number, context?: LoadContext) {
  return apiFetch<Array<BookSummary>>(`/admin/books?page=${page}&limit=${limit}`, {}, context)
}

export async function getBook(bookId: string, context?: LoadContext) {
  return apiFetch<BookDetail>(`/admin/books/${bookId}`, {}, context)
}

export async function getPdfUrl(bookId: string, context?: LoadContext) {
  const payload = await apiFetch<{ url: string | null }>(`/admin/books/${bookId}/pdf-url`, {}, context)
  return payload.url
}

export async function reviewBook(
  bookId: string,
  input: { action: 'approve' | 'reject'; notes?: string; reviewed_by: string },
  context?: LoadContext,
) {
  return apiFetch<{ status: string }>(`/admin/books/${bookId}/review`, {
    method: 'POST',
    body: JSON.stringify(input),
  }, context)
}

export type BookSummary = {
  id: string
  status: string
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

export type BookDetail = BookSummary & {
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
    }>
  }
}
