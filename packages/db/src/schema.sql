-- ============================================================
-- StoryBox — executa no Supabase SQL Editor
-- ============================================================

-- Subscribers
CREATE TABLE subscribers (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone                   TEXT NOT NULL UNIQUE,
  email                   TEXT,
  cpf                     TEXT,
  full_name               TEXT NOT NULL,
  plan                    TEXT NOT NULL, -- nome/slug do produto cadastrado na AbacatePay (dinâmico)
  status                  TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','cancelled','pending_payment')),
  abacatepay_customer_id  TEXT,
  abacatepay_plan_id      TEXT,
  is_recurring            BOOLEAN NOT NULL DEFAULT false, -- assinatura (true) vs livro avulso (false)
  last_weekly_kickoff_sent_at TIMESTAMPTZ, -- último convite semanal de coleta enviado (assinantes)
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Children
CREATE TABLE children (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id       UUID NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  birth_date          DATE NOT NULL,
  visual_profile      JSONB,          -- VisualProfile extraído da foto
  photo_storage_path  TEXT,           -- path no Supabase Storage
  image_consent       BOOLEAN NOT NULL DEFAULT false,
  image_consent_at    TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Family members (pai, mãe, avós etc — cadastrados um a um com foto própria,
-- pra servir de referência real nas ilustrações, em vez de tentar adivinhar
-- quem é quem a partir de uma única foto de grupo)
CREATE TABLE family_members (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id       UUID NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  role                TEXT,           -- papel digitado livre pela família: "mamãe", "papai", "avó"
  visual_profile      JSONB,          -- VisualProfile extraído da foto
  photo_storage_path  TEXT,           -- path no Supabase Storage
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Monthly collections
CREATE TABLE monthly_collections (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id                    UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  subscriber_id               UUID NOT NULL REFERENCES subscribers(id),
  reference_month             DATE NOT NULL,   -- primeiro dia do mês
  status                      TEXT NOT NULL DEFAULT 'collecting' CHECK (
    status IN ('collecting','ready','generating','review','approved','delivered','skipped')
  ),
  photo_storage_path          TEXT,
  moment_text                 TEXT,
  challenge_text              TEXT,
  theme_pref                  TEXT,
  reminders_sent              INT NOT NULL DEFAULT 0,
  last_reminder_at            TIMESTAMPTZ,
  collection_completed_at     TIMESTAMPTZ,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (child_id, reference_month)
);

-- Books
CREATE TABLE books (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id               UUID NOT NULL REFERENCES monthly_collections(id),
  child_id                    UUID NOT NULL REFERENCES children(id),
  status                      TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN (
      'pending','generating_text','generating_images','assembling',
      'ready_for_review','approved','rejected',
      'delivered_digital','sent_to_print','delivered_physical'
    )
  ),
  title                       TEXT,
  story_json                  JSONB,
  moral                       TEXT,
  pdf_storage_path            TEXT,
  cover_image_storage_path    TEXT,
  reviewed_by                 TEXT,
  reviewed_at                 TIMESTAMPTZ,
  review_notes                TEXT,
  llm_model                   TEXT,
  image_model                 TEXT,
  generation_cost_usd         NUMERIC(8,4),
  generation_completed_at     TIMESTAMPTZ,
  digital_sent_at             TIMESTAMPTZ,
  print_order_id              TEXT,
  print_tracking_code         TEXT,
  print_estimated_delivery    DATE,
  physical_delivered_at       TIMESTAMPTZ,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Delivery addresses
CREATE TABLE delivery_addresses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id   UUID NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
  is_default      BOOLEAN NOT NULL DEFAULT true,
  recipient_name  TEXT NOT NULL,
  street          TEXT NOT NULL,
  number          TEXT NOT NULL,
  complement      TEXT,
  neighborhood    TEXT NOT NULL,
  city            TEXT NOT NULL,
  state           CHAR(2) NOT NULL,
  zip_code        CHAR(8) NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Agent states (LangGraph checkpoints)
CREATE TABLE agent_states (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id   UUID NOT NULL REFERENCES subscribers(id),
  thread_id       TEXT NOT NULL UNIQUE,
  graph_name      TEXT NOT NULL,
  state_json      JSONB NOT NULL DEFAULT '{}',
  checkpoint_id   TEXT,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- WhatsApp messages log
CREATE TABLE wa_messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id      TEXT NOT NULL UNIQUE,
  subscriber_id   UUID REFERENCES subscribers(id),
  direction       TEXT NOT NULL CHECK (direction IN ('inbound','outbound')),
  type            TEXT NOT NULL,
  content         JSONB NOT NULL,
  processed       BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Índices ────────────────────────────────────────────────
CREATE INDEX idx_children_subscriber      ON children(subscriber_id);
CREATE INDEX idx_collections_child_month  ON monthly_collections(child_id, reference_month);
CREATE INDEX idx_collections_status       ON monthly_collections(status);
CREATE INDEX idx_books_collection         ON books(collection_id);
CREATE INDEX idx_books_status             ON books(status);
CREATE INDEX idx_wa_messages_subscriber   ON wa_messages(subscriber_id);
CREATE INDEX idx_wa_messages_unprocessed  ON wa_messages(processed) WHERE processed = false;

-- ── updated_at automático ──────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_subscribers_updated_at
  BEFORE UPDATE ON subscribers FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_children_updated_at
  BEFORE UPDATE ON children FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_collections_updated_at
  BEFORE UPDATE ON monthly_collections FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_books_updated_at
  BEFORE UPDATE ON books FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Supabase Storage buckets ───────────────────────────────
-- Execute também no SQL Editor:
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('storybox-assets', 'storybox-assets', false);  -- privado — acesso via signed URLs
