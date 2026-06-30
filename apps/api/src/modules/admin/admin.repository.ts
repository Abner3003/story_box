import { getSupabaseClient } from '@storybox/db'
import type { BookStatus, CollectionStatus } from '@storybox/db'

export async function listBooks(filters: { status?: BookStatus; limit: number; offset: number }) {
  const db = getSupabaseClient()
  let query = db.from('books').select('*, children(name), monthly_collections(reference_month)')

  if (filters.status) query = query.eq('status', filters.status)

  const { data, error } = await query
    .order('created_at', { ascending: false })
    .range(filters.offset, filters.offset + filters.limit - 1)

  if (error) throw error
  return data
}

export async function getBookById(id: string) {
  const db = getSupabaseClient()
  const { data, error } = await db.from('books').select('*').eq('id', id).single()
  if (error) throw error
  return data
}

export async function updateBookStatus(
  id: string,
  patch: { status: BookStatus; reviewed_by?: string; reviewed_at?: string; review_notes?: string }
) {
  const db = getSupabaseClient()
  const { error } = await db.from('books').update(patch).eq('id', id)
  if (error) throw error
}

export async function listCollections(filters: { status?: CollectionStatus; limit: number; offset: number }) {
  const db = getSupabaseClient()
  let query = db.from('monthly_collections').select('*, children(name, subscriber_id)')

  if (filters.status) query = query.eq('status', filters.status)

  const { data, error } = await query
    .order('created_at', { ascending: false })
    .range(filters.offset, filters.offset + filters.limit - 1)

  if (error) throw error
  return data
}
