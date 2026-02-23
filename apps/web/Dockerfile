FROM node:22-alpine AS base
RUN corepack enable

# ── Install ────────────────────────────────
FROM base AS deps
WORKDIR /app
COPY package.json ./
RUN pnpm install

# ── Build ──────────────────────────────────
FROM base AS builder
WORKDIR /app
ARG NEXT_PUBLIC_API_URL=http://4.188.97.229:4000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN mkdir -p public
RUN pnpm build

# ── Run ────────────────────────────────────
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]
