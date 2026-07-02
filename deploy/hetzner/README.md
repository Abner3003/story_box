# Deploy na Hetzner

Este diretório contém a stack de produção do StoryBox para uma VM na Hetzner:

- `docker-compose.yml`: API + Redis + Caddy
- `Caddyfile`: TLS e reverse proxy para a API

## Fluxo

1. O GitHub Actions builda `apps/api/Dockerfile`.
2. A imagem é publicada no GHCR.
3. O job de deploy copia os arquivos para a VM da Hetzner.
4. O arquivo `.env` da stack é gerado a partir dos secrets do repositório.
5. `docker compose up -d` reinicia a stack.

Se preferir configurar manualmente, copie [`deploy/hetzner/.env.example`](./.env.example) para `.env`.

## Secrets usados

Obrigatórios para o deploy da API:

- `GHCR_USERNAME`
- `GHCR_PAT`
- `HETZNER_HOST`
- `HETZNER_USER`
- `HETZNER_SSH_KEY`
- `API_DOMAIN` como variável do repositório
- `DATABASE_URL`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `META_PHONE_NUMBER_ID`
- `META_ACCESS_TOKEN`

Também aceitos, quando existirem:

- `META_API_VERSION`
- `WHATSAPP_VERIFY_TOKEN` ou `META_VERIFY_TOKEN`
- `ABACATEPAY_API_KEY`
- `APP_URL`
- `API_PUBLIC_URL`
- `PUBLIC_API_URL`
- `STORYBOX_CONSENT_URL`
- `STORYBOX_INTRO_VIDEO_URL`

## Observação sobre workers

Os secrets `HETZNER_WORKERS_HOST`, `HETZNER_WORKERS_USER` e `HETZNER_WORKERS_SSH_KEY` ainda não estão ligados a um serviço separado, porque o repositório hoje não tem um entrypoint de worker dedicado. Quando isso existir, a mesma abordagem pode ser reaproveitada.
