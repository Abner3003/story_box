import { SupabaseClient } from '@supabase/supabase-js';
export type SubscriberStatus = 'active' | 'paused' | 'cancelled' | 'pending_payment';
export type SubscriberPlan = string;
export type CollectionStatus = 'collecting' | 'ready' | 'generating' | 'review' | 'approved' | 'delivered' | 'skipped';
export type BookStatus = 'pending' | 'generating_text' | 'generating_images' | 'assembling' | 'ready_for_review' | 'approved' | 'rejected' | 'delivered_digital' | 'sent_to_print' | 'delivered_physical';
export type Subscriber = {
    id: string;
    phone: string;
    email?: string;
    cpf?: string;
    full_name: string;
    plan: SubscriberPlan;
    status: SubscriberStatus;
    abacatepay_customer_id?: string;
    abacatepay_plan_id?: string;
    is_recurring: boolean;
    last_weekly_kickoff_sent_at?: string;
    created_at: string;
    updated_at: string;
};
export type Child = {
    id: string;
    subscriber_id: string;
    name: string;
    birth_date: string;
    visual_profile?: VisualProfile;
    photo_storage_path?: string;
    image_consent: boolean;
    image_consent_at?: string;
    created_at: string;
    updated_at: string;
};
export interface VisualProfile {
    age_description: string;
    hair: string;
    eyes: string;
    skin: string;
    raw_description: string;
    chosen_style?: string;
}
export type MonthlyCollection = {
    id: string;
    child_id: string;
    subscriber_id: string;
    reference_month: string;
    status: CollectionStatus;
    photo_storage_path?: string;
    moment_text?: string;
    challenge_text?: string;
    theme_pref?: string;
    reminders_sent: number;
    last_reminder_at?: string;
    collection_completed_at?: string;
    created_at: string;
    updated_at: string;
};
export type Book = {
    id: string;
    collection_id: string;
    child_id: string;
    status: BookStatus;
    title?: string;
    story_json?: StoryJSON;
    moral?: string;
    pdf_storage_path?: string;
    cover_image_storage_path?: string;
    reviewed_by?: string;
    reviewed_at?: string;
    review_notes?: string;
    llm_model?: string;
    image_model?: string;
    generation_cost_usd?: number;
    generation_completed_at?: string;
    digital_sent_at?: string;
    print_order_id?: string;
    print_tracking_code?: string;
    print_estimated_delivery?: string;
    physical_delivered_at?: string;
    created_at: string;
    updated_at: string;
};
export interface StoryPage {
    page_number: number;
    text: string;
    illustration_prompt: string;
    image_storage_path?: string;
}
export interface StoryJSON {
    title: string;
    moral: string;
    pages: StoryPage[];
}
export type DeliveryAddress = {
    id: string;
    subscriber_id: string;
    is_default: boolean;
    recipient_name: string;
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zip_code: string;
    created_at: string;
};
export type AgentState = {
    id: string;
    subscriber_id: string;
    thread_id: string;
    graph_name: string;
    state_json: Record<string, unknown>;
    checkpoint_id?: string;
    updated_at: string;
};
export type WaMessageDirection = 'inbound' | 'outbound';
export type WaMessageType = 'text' | 'image' | 'audio' | 'document' | 'interactive';
export type WaMessage = {
    id: string;
    message_id: string;
    subscriber_id?: string;
    direction: WaMessageDirection;
    type: WaMessageType;
    content: string;
    processed: boolean;
    created_at: string;
};
export interface Database {
    public: {
        Tables: {
            subscribers: {
                Row: Subscriber;
                Insert: Omit<Subscriber, 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Omit<Subscriber, 'id' | 'created_at' | 'updated_at'>>;
                Relationships: [];
            };
            children: {
                Row: Child;
                Insert: Omit<Child, 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Omit<Child, 'id' | 'created_at' | 'updated_at'>>;
                Relationships: [
                    {
                        foreignKeyName: 'children_subscriber_id_fkey';
                        columns: ['subscriber_id'];
                        isOneToOne: false;
                        referencedRelation: 'subscribers';
                        referencedColumns: ['id'];
                    }
                ];
            };
            monthly_collections: {
                Row: MonthlyCollection;
                Insert: Omit<MonthlyCollection, 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Omit<MonthlyCollection, 'id' | 'created_at' | 'updated_at'>>;
                Relationships: [
                    {
                        foreignKeyName: 'monthly_collections_child_id_fkey';
                        columns: ['child_id'];
                        isOneToOne: false;
                        referencedRelation: 'children';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'monthly_collections_subscriber_id_fkey';
                        columns: ['subscriber_id'];
                        isOneToOne: false;
                        referencedRelation: 'subscribers';
                        referencedColumns: ['id'];
                    }
                ];
            };
            books: {
                Row: Book;
                Insert: Omit<Book, 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Omit<Book, 'id' | 'created_at' | 'updated_at'>>;
                Relationships: [
                    {
                        foreignKeyName: 'books_collection_id_fkey';
                        columns: ['collection_id'];
                        isOneToOne: false;
                        referencedRelation: 'monthly_collections';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'books_child_id_fkey';
                        columns: ['child_id'];
                        isOneToOne: false;
                        referencedRelation: 'children';
                        referencedColumns: ['id'];
                    }
                ];
            };
            delivery_addresses: {
                Row: DeliveryAddress;
                Insert: Omit<DeliveryAddress, 'id' | 'created_at'>;
                Update: Partial<Omit<DeliveryAddress, 'id' | 'created_at'>>;
                Relationships: [
                    {
                        foreignKeyName: 'delivery_addresses_subscriber_id_fkey';
                        columns: ['subscriber_id'];
                        isOneToOne: false;
                        referencedRelation: 'subscribers';
                        referencedColumns: ['id'];
                    }
                ];
            };
            agent_states: {
                Row: AgentState;
                Insert: Omit<AgentState, 'id'>;
                Update: Partial<Omit<AgentState, 'id'>>;
                Relationships: [
                    {
                        foreignKeyName: 'agent_states_subscriber_id_fkey';
                        columns: ['subscriber_id'];
                        isOneToOne: false;
                        referencedRelation: 'subscribers';
                        referencedColumns: ['id'];
                    }
                ];
            };
            wa_messages: {
                Row: WaMessage;
                Insert: Omit<WaMessage, 'id' | 'processed' | 'created_at'>;
                Update: Partial<Omit<WaMessage, 'id' | 'processed' | 'created_at'>>;
                Relationships: [
                    {
                        foreignKeyName: 'wa_messages_subscriber_id_fkey';
                        columns: ['subscriber_id'];
                        isOneToOne: false;
                        referencedRelation: 'subscribers';
                        referencedColumns: ['id'];
                    }
                ];
            };
        };
        Views: {
            [_ in never]: never;
        };
        Functions: {
            [_ in never]: never;
        };
        Enums: {
            [_ in never]: never;
        };
        CompositeTypes: {
            [_ in never]: never;
        };
    };
}
export declare function getSupabaseClient(): SupabaseClient<Database>;
export declare const StoragePaths: {
    readonly childPhoto: (childId: string, month: string) => string;
    readonly momentPhoto: (childId: string, period: string) => string;
    readonly stylePreview: (childId: string, styleId: string) => string;
    readonly bookPdf: (bookId: string) => string;
    readonly bookCover: (bookId: string) => string;
    readonly bookPage: (bookId: string, n: number) => string;
    readonly consentPage: (subscriberId: string) => string;
};
//# sourceMappingURL=index.d.ts.map