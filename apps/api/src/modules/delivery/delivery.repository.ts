import { getSupabaseClient } from '@storybox/db'

const ASSETS_BUCKET = 'storybox-assets'
const SIGNED_URL_TTL = 60 * 60 * 24 * 7 // 7 dias

// Genérico — serve pra PDF, capa ou imagem de página, qualquer path do bucket privado.
export async function getSignedAssetUrl(path: string): Promise<string> {
  const db = getSupabaseClient()
  const { data, error } = await db.storage.from(ASSETS_BUCKET).createSignedUrl(path, SIGNED_URL_TTL)
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

// Livro físico esperando a resposta "aprovado?" do assinante antes de seguir
// pra impressão — usado pelo webhook pra saber que a próxima mensagem desse
// número é uma resposta de aprovação, não uma nova conversa.
export async function findBookAwaitingApproval(subscriberId: string) {
  const db = getSupabaseClient()
  const { data, error } = await db
    .from('books')
    .select('*, monthly_collections!inner(subscriber_id)')
    .eq('monthly_collections.subscriber_id', subscriberId)
    .eq('status', 'awaiting_print_approval')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data
}
