import { getSupabaseClient } from '@storybox/db'

export async function getChildWithSubscriber(childId: string) {
  const db = getSupabaseClient()
  const { data, error } = await db
    .from('children')
    .select('*, subscribers(id, phone, full_name)')
    .eq('id', childId)
    .single()

  if (error) throw error
  return data
}

export async function grantImageConsent(childId: string) {
  const db = getSupabaseClient()
  const { error } = await db
    .from('children')
    .update({ image_consent: true, image_consent_at: new Date().toISOString() })
    .eq('id', childId)

  if (error) throw error
}

export async function revokeImageConsent(childId: string) {
  const db = getSupabaseClient()
  const { error } = await db
    .from('children')
    .update({ image_consent: false, image_consent_at: new Date().toISOString() })
    .eq('id', childId)

  if (error) throw error
}
