import { getSupabaseClient } from '@storybox/db'

const ASSETS_BUCKET = 'storybox-assets'
const PDF_SIGNED_URL_TTL = 60 * 60 * 24 * 7 // 7 dias

export async function getSignedPdfUrl(path: string): Promise<string> {
  const db = getSupabaseClient()
  const { data, error } = await db.storage.from(ASSETS_BUCKET).createSignedUrl(path, PDF_SIGNED_URL_TTL)
  if (error || !data) throw error ?? new Error(`Falha ao gerar signed URL pra ${path}`)
  return data.signedUrl
}

export async function markBookDelivered(bookId: string) {
  const db = getSupabaseClient()
  const { error } = await db
    .from('books')
    .update({ status: 'delivered_digital', digital_sent_at: new Date().toISOString() })
    .eq('id', bookId)
  if (error) throw error
}
