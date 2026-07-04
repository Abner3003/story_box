import axios from 'axios'

import { getAdminApiKey } from './auth.client.js'
import type {
  AdminBookDetail,
  AdminBookSummary,
  ListBooksQuery,
  ReviewBookBody,
  UpdateBookBody,
} from './admin-types.js'

const apiBaseURL =
  import.meta.env.VITE_API_PUBLIC_URL?.trim() || 'https://storybox-api.mentebella.com.br'

export const adminApi = axios.create({
  baseURL: apiBaseURL,
  timeout: 30_000,
})

adminApi.interceptors.request.use((config) => {
  const apiKey = getAdminApiKey()

  if (apiKey) {
    config.headers = config.headers ?? {}
    config.headers['x-admin-key'] = apiKey
  }

  return config
})

export async function listBooks(query: ListBooksQuery) {
  const params = new URLSearchParams()
  if (query.status) params.set('status', query.status)
  if (query.page) params.set('page', String(query.page))
  if (query.limit) params.set('limit', String(query.limit))

  const { data } = await adminApi.get<AdminBookSummary[]>(`/admin/books?${params.toString()}`)
  return data
}

export async function getBook(bookId: string) {
  const { data } = await adminApi.get<AdminBookDetail>(`/admin/books/${bookId}`)
  return data
}

export async function getPdfUrl(bookId: string) {
  const { data } = await adminApi.get<{ url: string | null }>(`/admin/books/${bookId}/pdf-url`)
  return data.url
}

export async function reviewBook(bookId: string, body: ReviewBookBody) {
  const { data } = await adminApi.post<{ status: string }>(`/admin/books/${bookId}/review`, body)
  return data
}

export async function updateBook(bookId: string, body: UpdateBookBody) {
  const { data } = await adminApi.patch<AdminBookDetail>(`/admin/books/${bookId}`, body)
  return data
}

