# StoryBox 📚

Box mensal de livros infantis personalizados com IA.

## Stack

- **API**: Node.js + Fastify + TypeScript
- **Agente**: LangGraph.js
- **Banco**: Supabase (Postgres + Storage)
- **Filas**: BullMQ + Redis
- **IA texto**: GPT-4o / Claude Sonnet
- **IA imagem**: GPT-4o (gpt-4o com image generation)
- **Pagamento**: AbacatePay
- **WhatsApp**: Meta Cloud API

## Setup local

### 1. Pré-requisitos

```bash
node >= 20
pnpm >= 9
docker + docker compose
```

### 2. Clone e instala dependências

```bash
git clone https://github.com/seu-user/storybox
cd storybox
pnpm install
```

### 3. Configura variáveis de ambiente

```bash
cp .env.example .env
# Edita o .env com suas chaves
```

### 4. Sobe Redis local

```bash
docker compose up -d
# Redis na porta 6379
# Bull Board (dashboard filas) em http://localhost:3002
```

### 5. Configura Supabase

1. Cria projeto em supabase.com
2. Vai em SQL Editor e roda o arquivo `packages/db/src/schema.sql`
3. Copia `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` pro `.env`

### 6. Roda a API

```bash
pnpm --filter @storybox/api dev
# API em http://localhost:3001
# Swagger em http://localhost:3001/docs
```

### 7. Expõe o webhook para a Meta (dev)

```bash
# Instala ngrok se não tiver
npx ngrok http 3001

# Copia a URL https://xxxx.ngrok.io
# Cola em Meta Developer > WhatsApp > Configuration > Webhook URL
# Endpoint: https://xxxx.ngrok.io/webhook
# Verify token: o mesmo que está no .env WHATSAPP_VERIFY_TOKEN ou META_VERIFY_TOKEN
```

## Testando a geração manualmente

Sem precisar de assinante nem WhatsApp:

```bash
curl -X POST http://localhost:3001/admin/generate-book \
  -H "Content-Type: application/json" \
  -H "x-admin-token: SEU_ADMIN_SECRET" \
  -d '{
    "child_name": "Arthur",
    "child_age": 2,
    "photo_url": "https://url-da-foto.jpg",
    "moment_text": "Ganhou o primeiro dente",
    "challenge_text": "Ciúme do irmãozinho",
    "theme_pref": "aventura"
  }'
```

Retorna `book_id` — acompanhe o status em:

```bash
curl http://localhost:3001/admin/books \
  -H "x-admin-token: SEU_ADMIN_SECRET"
```

## Estrutura do projeto

```
storybox/
├── apps/
│   ├── api/          ← Fastify API + LangGraph agents
│   ├── admin/        ← Next.js painel de curadoria
│   └── web/          ← Next.js landing page
├── packages/
│   ├── db/           ← Supabase client + tipos + schema
│   ├── shared/       ← constantes, prompts
│   └── queues/       ← BullMQ filas
└── docker-compose.yml
```

## Deploy na Hetzner

O deploy de produção está documentado em [`deploy/hetzner/README.md`](deploy/hetzner/README.md).

Resumo:

1. A API sobe em Docker.
2. Redis roda no mesmo host.
3. Caddy termina TLS e faz reverse proxy para a API.
4. O GitHub Actions publica a imagem no GHCR e atualiza a VM via SSH.

## Fluxo de geração

```
POST /admin/generate-book
  → cria book no banco (status: pending)
  → enfileira job no BullMQ

generation worker
  → GPT-4o Vision: extrai visual_profile da foto
  → GPT-4o: gera história em JSON estruturado
  → GPT-4o Image: gera 8 ilustrações em paralelo
  → PDF engine: monta book.pdf
  → status: ready_for_review

Admin aprova no painel
  → delivery worker
  → envia PDF no WhatsApp
  → dispara pedido na gráfica
```
# story_box
# story_box
# story_box
# story_box
# story_box
# story_box
# story_box
