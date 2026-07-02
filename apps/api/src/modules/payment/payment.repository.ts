import { getSupabaseClient } from '@storybox/db'
import type { SubscriberStatus } from '@storybox/db'

export async function findSubscriberByAbacatePayId(customerId: string) {
  const db = getSupabaseClient()
  const { data, error } = await db
    .from('subscribers')
    .select('*')
    .eq('abacatepay_customer_id', customerId)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function findSubscriberByPhone(phone: string) {
  const db = getSupabaseClient()
  const { data, error } = await db
    .from('subscribers')
    .select('*')
    .eq('phone', phone)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function updateSubscriberStatus(id: string, status: SubscriberStatus) {
  const db = getSupabaseClient()
  const { error } = await db.from('subscribers').update({ status }).eq('id', id)
  if (error) throw error
}

export async function updateSubscriberBilling(
  id: string,
  patch: { status?: SubscriberStatus; abacatepayCustomerId?: string },
) {
  const db = getSupabaseClient()
  const { error } = await db
    .from('subscribers')
    .update({
      ...(patch.status ? { status: patch.status } : {}),
      ...(patch.abacatepayCustomerId ? { abacatepay_customer_id: patch.abacatepayCustomerId } : {}),
    })
    .eq('id', id)

  if (error) throw error
}
