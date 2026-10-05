# syntax = docker/dockerfile:1

# Bun ponta a ponta (ADR-002): node é proibido como runtime nosso.
FROM oven/bun:1-debian AS base
WORKDIR /app

# ── Dependências ─────────────────────────────────────────────────────────────
FROM base AS deps
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

# ── Build ───────────────────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Env de BUILD:
#  - INTERNAL_API_URL é validada em boot (serverEnv, falha-fechado) e usada no
#    rewrite `/api/*` do next.config.ts;
#  - NEXT_PUBLIC_API_URL é inlinada no bundle do browser (mesmo-origin `/`).
# Valores padrão = backend de produção; sobrescreva via `--build-arg`.
ARG INTERNAL_API_URL=https://api.arbtraders.com.br
ARG NEXT_PUBLIC_API_URL=/

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV INTERNAL_API_URL=$INTERNAL_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN bun run build

# ── Runner (Bun, output standalone) ──────────────────────────────────────────
FROM oven/bun:1-alpine AS runner
WORKDIR /app

# INTERNAL_API_URL também é lida em RUNTIME pelo kyServer (serverEnv).
# NEXT_PUBLIC_API_URL não precisa aqui: já foi inlinada no build.
ARG INTERNAL_API_URL=https://api.arbtraders.com.br

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV INTERNAL_API_URL=$INTERNAL_API_URL

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

CMD ["bun", "server.js"]
