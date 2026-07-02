import { getSupabaseClient } from '@storybox/db'
import type { Subscriber } from '@storybox/db'
import type { WhatsAppMessage } from './webhook.models.js'

export async function findSubscriberByPhone(phone: string): Promise<Subscriber | null> {
  const db = getSupabaseClient()
  const { data, error } = await db
    .from('subscribers')
    .select('*')
    .eq('phone', phone)
    .maybeSingle()
  if (error) throw error
  return data
}



export async function logInboundMessage(payload: {
  subscriber_id: string
  message_id: string
  direction: 'inbound'
  type: WhatsAppMessage['type']
  content: string
}) {
  const db = getSupabaseClient()
  const { error } = await db.from('wa_messages').insert(payload)
  if (error) throw error
}
  // id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  // message_id      TEXT NOT NULL UNIQUE,
  // subscriber_id   UUID REFERENCES subscribers(id),
  // direction       TEXT NOT NULL CHECK (direction IN ('inbound','outbound')),
  // type            TEXT NOT NULL,
  // content         JSONB NOT NULL,
  // processed       BOOLEAN NOT NULL DEFAULT false,
  // created_at      TIMESTAMPTZ NOT NULL DEFAULT now()