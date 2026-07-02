import { createClient, SupabaseClient } from '@supabase/supabase-js'

// ─────────────────────────────────────────────
// Tipos do banco — espelham as tabelas do Supabase
// ─────────────────────────────────────────────

export type SubscriberStatus = 'active' | 'paused' | 'cancelled' | 'pending_payment'
export type SubscriberPlan   = string // nome/slug do produto cadastrado na AbacatePay

export type CollectionStatus =
  | 'collecting' | 'ready' | 'generating'
  | 'review'     | 'approved' | 'delivered' | 'skipped'

export type BookStatus =
  | 'pending'          | 'generating_text'   | 'generating_images'
  | 'assembling'       | 'ready_for_review'  | 'approved'
  | 'rejected'         | 'delivered_digital' | 'sent_to_print'
  | 'delivered_physical'

export interface Subscriber {
  id: string
  phone: string                  // E.164: +5511999...
  email?: string
  full_name: string
  plan: SubscriberPlan
  status: SubscriberStatus
  abacatepay_customer_id?: string
  abacatepay_plan_id?: string
  created_at: string
  updated_at: string
}

export interface Child {
  id: string
  subscriber_id: string
  name: string
  birth_date: string             // ISO date: 2022-03-15
  visual_profile?: VisualProfile // extraído da foto via GPT-4o Vision
  photo_storage_path?: string    // path no Supabase Storage
  image_consent: boolean
  image_consent_at?: string
  created_at: string
  updated_at: string
}

export interface VisualProfile {
  age_description: string        // "2-year-old"
  hair: string                   // "curly brown hair"
  eyes: string                   // "honey-colored eyes"
  skin: string                   // "warm medium skin tone"
  raw_description: string        // texto completo retornado pelo GPT-4o Vision
}

export interface MonthlyCollection {
  id: string
  child_id: string
  subscriber_id: string
  reference_month: string        // "2025-06-01"
  status: CollectionStatus
  photo_storage_path?: string
  moment_text?: string
  challenge_text?: string
  theme_pref?: string
  reminders_sent: number
  last_reminder_at?: string
  collection_completed_at?: string
  created_at: string
  updated_at: string
}

export interface Book {
  id: string
  collection_id: string
  child_id: string
  status: BookStatus
  title?: string
  story_json?: StoryJSON
  moral?: string
  pdf_storage_path?: string
  cover_image_storage_path?: string
  reviewed_by?: string
  reviewed_at?: string
  review_notes?: string
  llm_model?: string
  image_model?: string
  generation_cost_usd?: number
  generation_completed_at?: string
  digital_sent_at?: string
  print_order_id?: string
  print_tracking_code?: string
  print_estimated_delivery?: string
  physical_delivered_at?: string
  created_at: string
  updated_at: string
}

export interface StoryPage {
  page_number: number
  text: string
  illustration_prompt: string    // prompt em inglês pra gerar a imagem
  image_storage_path?: string    // preenchido após geração
}

export interface StoryJSON {
  title: string
  moral: string
  pages: StoryPage[]
}

export interface DeliveryAddress {
  id: string
  subscriber_id: string
  is_default: boolean
  recipient_name: string
  street: string
  number: string
  complement?: string
  neighborhood: string
  city: string
  state: string                  // UF: "SP"
  zip_code: string               // "01310100"
  created_at: string
}

export interface AgentState {
  id: string
  subscriber_id: string
  thread_id: string              // LangGraph thread_id
  graph_name: string
  state_json: Record<string, unknown>
  checkpoint_id?: string
  updated_at: string
}

export type WaMessageDirection = 'inbound' | 'outbound'
export type WaMessageType = 'text' | 'image' | 'audio' | 'document' | 'interactive'

export interface WaMessage {
  id: string
  message_id: string
  subscriber_id: string
  direction: WaMessageDirection
  type: WaMessageType
  content: string
  processed: boolean
  created_at: string
}

// ─────────────────────────────────────────────
// Database type — usado pelo client tipado
// ─────────────────────────────────────────────

export interface Database {
  public: {
    Tables: {
      subscribers:         { Row: Subscriber;         Insert: Omit<Subscriber, 'id' | 'created_at' | 'updated_at'>                    }
      children:            { Row: Child;              Insert: Omit<Child, 'id' | 'created_at' | 'updated_at'>                         }
      monthly_collections: { Row: MonthlyCollection;  Insert: Omit<MonthlyCollection, 'id' | 'created_at' | 'updated_at'>             }
      books:               { Row: Book;               Insert: Omit<Book, 'id' | 'created_at' | 'updated_at'>                          }
      delivery_addresses:  { Row: DeliveryAddress;    Insert: Omit<DeliveryAddress, 'id' | 'created_at'>                              }
      agent_states:        { Row: AgentState;         Insert: Omit<AgentState, 'id'>                                                  }
      wa_messages:         { Row: WaMessage;          Insert: Omit<WaMessage, 'id' | 'processed' | 'created_at'>                      }
    }
  }
}

// ─────────────────────────────────────────────
// Client singleton — importa em qualquer app
// ─────────────────────────────────────────────

let _client: SupabaseClient<Database> | null = null

export function getSupabaseClient(): SupabaseClient<Database> {
  if (_client) return _client

  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY  // service role — só no backend

  if (!url || !key) {
    throw new Error('SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios')
  }

  _client = createClient<Database>(url, key, {
    auth: { persistSession: false }
  })

  return _client
}

// ─────────────────────────────────────────────
// Helper: Storage — paths padronizados
// ─────────────────────────────────────────────

export const StoragePaths = {
  childPhoto:      (childId: string, month: string) => `children/${childId}/photos/${month}.jpg`,
  bookPdf:         (bookId: string)                 => `books/${bookId}/book.pdf`,
  bookCover:       (bookId: string)                 => `books/${bookId}/cover.png`,
  bookPage:        (bookId: string, n: number)      => `books/${bookId}/pages/page_${String(n).padStart(2, '0')}.png`,
  consentPage:     (subscriberId: string)           => `consent/${subscriberId}/terms.html`,
} as const
