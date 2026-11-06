# ── Stage 1: Build & Dependencies ──────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Install native dependencies required by Prisma engine on Alpine Linux
RUN apk add --no-cache libc6-compat openssl

# Install dependencies with caching
COPY package*.json ./
RUN npm ci

# Copy Prisma schema and generate client
COPY prisma ./prisma
ENV DATABASE_URL="postgresql://placeholder:5432/placeholder"
RUN npx prisma generate

# Remove development dependencies to keep image lean
RUN npm prune --production

# ── Stage 2: Production Lightweight Image ──────────────────────────────────────
FROM node:22-alpine AS runner

WORKDIR /app

# Install runtime dependencies for Prisma on Alpine
RUN apk add --no-cache libc6-compat openssl

# Security: run as non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 civicax

ENV NODE_ENV=production
ENV PORT=3001

# Copy production node_modules with generated Prisma client
COPY --from=builder --chown=civicax:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=civicax:nodejs /app/package*.json ./

# Copy application source code
COPY --chown=civicax:nodejs config ./config
COPY --chown=civicax:nodejs middleware ./middleware
COPY --chown=civicax:nodejs modules ./modules
COPY --chown=civicax:nodejs prisma ./prisma
COPY --chown=civicax:nodejs routes ./routes
COPY --chown=civicax:nodejs seeds ./seeds
COPY --chown=civicax:nodejs services ./services
COPY --chown=civicax:nodejs shared ./shared
COPY --chown=civicax:nodejs socket ./socket
COPY --chown=civicax:nodejs index.js ./

# Create directory for file uploads and logs with proper permissions
RUN mkdir -p uploads logs && chown -R civicax:nodejs uploads logs

USER civicax

EXPOSE 3001

# Zero-downtime startup: runs Prisma migrations before starting HTTP server
CMD ["npm", "run", "start:migrate"]
