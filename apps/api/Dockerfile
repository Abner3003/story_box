FROM node:24-bookworm-slim

ENV PNPM_HOME="/usr/local/share/pnpm"
ENV PATH="${PNPM_HOME}:${PATH}"

RUN corepack enable
RUN corepack prepare pnpm@9.15.0 --activate

RUN apt-get update \
  && apt-get install -y --no-install-recommends ffmpeg \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/api/tsconfig.json apps/api/tsconfig.json
COPY apps/api/src apps/api/src
COPY packages/db/package.json packages/db/package.json
COPY packages/db/tsconfig.json packages/db/tsconfig.json
COPY packages/db/src packages/db/src
COPY packages/queues/package.json packages/queues/package.json
COPY packages/queues/tsconfig.json packages/queues/tsconfig.json
COPY packages/queues/src packages/queues/src
COPY packages/shared/package.json packages/shared/package.json
COPY packages/shared/tsconfig.json packages/shared/tsconfig.json
COPY packages/shared/src packages/shared/src

RUN pnpm install --frozen-lockfile
RUN pnpm build

EXPOSE 3001

CMD ["node", "apps/api/dist/server.js"]
