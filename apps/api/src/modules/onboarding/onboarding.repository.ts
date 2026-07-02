import { getSupabaseClient } from '@storybox/db'
import type { VisualProfile, SubscriberPlan, SubscriberStatus } from '@storybox/db'

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
