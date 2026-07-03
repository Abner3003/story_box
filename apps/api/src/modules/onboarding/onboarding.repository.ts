import { getSupabaseClient, StoragePaths } from '@storybox/db'
import type { VisualProfile, SubscriberPlan, SubscriberStatus } from '@storybox/db'

const ASSETS_BUCKET = 'storybox-assets'
const STYLE_PREVIEW_SIGNED_URL_TTL = 60 * 60 * 24 // 1 dia

export async function upsertSubscriber(data: {
  phone: string
  plan: SubscriberPlan
  full_name: string
  abacatepay_plan_id?: string
  status?: SubscriberStatus
}) {
  const db = getSupabaseClient()
  const { data: row, error } = await db
    .from('subscribers')
    .upsert(
      {
        phone: data.phone,
        plan: data.plan,
        full_name: data.full_name,
        status: data.status ?? 'pending_payment',
        abacatepay_plan_id: data.abacatepay_plan_id,
      },
      { onConflict: 'phone' },
    )
    .select('id')
    .single()
  if (error) throw error
  return row.id as string
}

export async function markSubscriberActiveByPhone(phone: string) {
  const db = getSupabaseClient()
  const { data, error } = await db
    .from('subscribers')
    .update({ status: 'active' })
    .eq('phone', phone)
    .select('id')
    .maybeSingle()

  if (error) throw error
  return data?.id ?? null
}

export async function createChild(data: {
  subscriber_id: string
  name: string
  birth_date: string
  image_consent: boolean
}) {
  const db = getSupabaseClient()
  const { data: row, error } = await db
    .from('children')
    .insert(data)
    .select('id')
    .single()
  if (error) throw error
  return row.id as string
}

export async function saveChildVisualProfile(childId: string, profile: VisualProfile, photoPath?: string) {
  const db = getSupabaseClient()
  const { error } = await db
    .from('children')
    .update({
      visual_profile:     profile,
      photo_storage_path: photoPath,
    })
    .eq('id', childId)
  if (error) throw error
}

export async function uploadChildPhoto(childId: string, base64: string, mimeType: string): Promise<string> {
  const db = getSupabaseClient()
  const path = StoragePaths.childPhoto(childId, new Date().toISOString().slice(0, 7))
  const buffer = Buffer.from(base64, 'base64')

  const { error } = await db.storage
    .from(ASSETS_BUCKET)
    .upload(path, buffer, { contentType: mimeType, upsert: true })
  if (error) throw error

  return path
}

export async function downloadChildPhoto(path: string): Promise<{ base64: string; mimeType: string }> {
  const db = getSupabaseClient()
  const { data, error } = await db.storage.from(ASSETS_BUCKET).download(path)
  if (error || !data) throw error ?? new Error(`Foto não encontrada em ${path}`)

  const buffer = Buffer.from(await data.arrayBuffer())
  return { base64: buffer.toString('base64'), mimeType: data.type || 'image/jpeg' }
}

export async function uploadStylePreview(childId: string, styleId: string, base64Png: string): Promise<string> {
  const db = getSupabaseClient()
  const path = StoragePaths.stylePreview(childId, styleId)
  const buffer = Buffer.from(base64Png, 'base64')

  const { error } = await db.storage
    .from(ASSETS_BUCKET)
    .upload(path, buffer, { contentType: 'image/png', upsert: true })
  if (error) throw error

  const { data, error: signError } = await db.storage
    .from(ASSETS_BUCKET)
    .createSignedUrl(path, STYLE_PREVIEW_SIGNED_URL_TTL)
  if (signError || !data) throw signError ?? new Error('Falha ao gerar signed URL do preview de estilo')

  return data.signedUrl
}

export async function saveChildStyleChoice(childId: string, styleLabel: string) {
  const db = getSupabaseClient()
  const { data: row, error: fetchError } = await db
    .from('children')
    .select('visual_profile')
    .eq('id', childId)
    .single()
  if (fetchError) throw fetchError

  const currentProfile = (row?.visual_profile as VisualProfile | null) ?? ({} as VisualProfile)

  const { error } = await db
    .from('children')
    .update({ visual_profile: { ...currentProfile, chosen_style: styleLabel } })
    .eq('id', childId)
  if (error) throw error
}

export async function upsertMonthlyCollection(data: {
  child_id: string
  subscriber_id: string
  moment_text: string
  challenge_text: string
}) {
  const db = getSupabaseClient()
  const referenceMonth = new Date()
  referenceMonth.setUTCDate(1)
  const reference_month = referenceMonth.toISOString().slice(0, 10)

  const { data: row, error } = await db
    .from('monthly_collections')
    .upsert(
      {
        child_id:                data.child_id,
        subscriber_id:           data.subscriber_id,
        reference_month,
        moment_text:             data.moment_text,
        challenge_text:          data.challenge_text,
        status:                  'generating',
        reminders_sent:          0,
        collection_completed_at: new Date().toISOString(),
      },
      { onConflict: 'child_id,reference_month' },
    )
    .select('id')
    .single()
  if (error) throw error
  return row.id as string
}
