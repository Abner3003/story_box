import { getSupabaseClient } from '@storybox/db'
import type { VisualProfile, SubscriberPlan } from '@storybox/db'

export async function createSubscriber(data: {
  phone: string
  plan: SubscriberPlan
  full_name: string
}) {
  const db = getSupabaseClient()
  const { data: row, error } = await db
    .from('subscribers')
    .insert(data)
    .select('id')
    .single()
  if (error) throw error
  return row.id as string
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
