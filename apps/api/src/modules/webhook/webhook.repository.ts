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



// Tenta "reservar" o message_id antes de processar. A unique constraint em
// wa_messages.message_id garante atomicidade: se a Meta reentregar o mesmo
// webhook (ex: nosso handler demorou pra responder), o insert bate na
// constraint e sabemos que já processamos essa mensagem — evita reprocessar
// o mesmo áudio/foto duas vezes e corromper o estado do LangGraph.
export async function claimMessage(payload: {
  message_id: string
  type: WhatsAppMessage['type']
  content: string
}): Promise<boolean> {
  const db = getSupabaseClient()
  const { error } = await db.from('wa_messages').insert({
    message_id: payload.message_id,
    direction: 'inbound',
    type: payload.type,
    content: payload.content,
  })
  if (!error) return true
  if (error.code === '23505') return false
  throw error
}
  // id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  // message_id      TEXT NOT NULL UNIQUE,
  // subscriber_id   UUID REFERENCES subscribers(id),
  // direction       TEXT NOT NULL CHECK (direction IN ('inbound','outbound')),
  // type            TEXT NOT NULL,
  // content         JSONB NOT NULL,
  // processed       BOOLEAN NOT NULL DEFAULT false,
  // created_at      TIMESTAMPTZ NOT NULL DEFAULT now()