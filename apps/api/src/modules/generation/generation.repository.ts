import { getSupabaseClient, StoragePaths } from '@storybox/db'
import type { BookStatus, Child, MonthlyCollection, StoryJSON } from '@storybox/db'

const ASSETS_BUCKET = 'storybox-assets'

export async function getCollectionForGeneration(
  collectionId: string,
): Promise<{ collection: MonthlyCollection; child: Child }> {
  const db = getSupabaseClient()
  const { data, error } = await db
    .from('monthly_collections')
    .select('*, children(*)')
    .eq('id', collectionId)
    .single()
  if (error) throw error

  const { children: child, ...collection } = data as MonthlyCollection & { children: Child }
  return { collection: collection as MonthlyCollection, child }
}

export async function findBookByCollectionId(collectionId: string) {
  const db = getSupabaseClient()
  const { data, error } = await db
    .from('books')
    .select('*')
    .eq('collection_id', collectionId)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function createBook(data: { collection_id: string; child_id: string; status: BookStatus }) {
  const db = getSupabaseClient()
  const { data: row, error } = await db
    .from('books')
    .insert(data)
    .select('*')
    .single()
  if (error) throw error
  return row
}

export async function updateBook(
  id: string,
  patch: Partial<{
    status: BookStatus
    title: string
    moral: string
    story_json: StoryJSON
    cover_image_storage_path: string
    pdf_storage_path: string
    llm_model: string
    image_model: string
    generation_completed_at: string
  }>,
) {
  const db = getSupabaseClient()
  const { error } = await db.from('books').update(patch).eq('id', id)
  if (error) throw error
}

export async function uploadBookAsset(
  path: string,
  content: Buffer | string,
  contentType: string,
): Promise<string> {
  const db = getSupabaseClient()
  const buffer = typeof content === 'string' ? Buffer.from(content, 'base64') : content

  const { error } = await db.storage
    .from(ASSETS_BUCKET)
    .upload(path, buffer, { contentType, upsert: true })
  if (error) throw error

  return path
}

export { StoragePaths }
