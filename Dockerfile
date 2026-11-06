# ── Root Dockerfile for Monorepo Cloud Deployments (Railway, Render, Fly.io) ──
FROM node:22-alpine AS builder

WORKDIR /app/server
RUN apk add --no-cache libc6-compat openssl

COPY server/package*.json ./
RUN npm ci

COPY server/prisma ./prisma
ENV DATABASE_URL="postgresql://placeholder:5432/placeholder"
RUN npx prisma generate
RUN npm prune --production

# ── Stage 2: Production Runner ────────────────────────────────────────────────
FROM node:22-alpine AS runner

WORKDIR /app/server
RUN apk add --no-cache libc6-compat openssl

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 civicax

ENV NODE_ENV=production
ENV PORT=3001

COPY --from=builder --chown=civicax:nodejs /app/server/node_modules ./node_modules
COPY --from=builder --chown=civicax:nodejs /app/server/package*.json ./
COPY --chown=civicax:nodejs server ./

RUN mkdir -p uploads logs && chown -R civicax:nodejs uploads logs

USER civicax

EXPOSE 3001

CMD ["npm", "run", "start:migrate"]
