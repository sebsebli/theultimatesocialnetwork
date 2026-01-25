# Multi-stage build for Next.js web app in monorepo
FROM node:20-alpine AS base

# Install pnpm
RUN npm install -g pnpm@8.15.1

# Install dependencies
FROM base AS deps
WORKDIR /app

# Copy workspace root files
COPY package.json pnpm-workspace.yaml .npmrc ./
COPY pnpm-lock.yaml* ./

# Copy web app package.json
COPY apps/web/package.json ./apps/web/

# Install dependencies for web app only
RUN pnpm install --filter web --frozen-lockfile

# Build stage
FROM base AS builder
WORKDIR /app

# Copy workspace root
COPY package.json pnpm-workspace.yaml .npmrc ./
COPY pnpm-lock.yaml* ./

# Copy node_modules from deps
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules

# Copy web app source
COPY apps/web ./apps/web

# Build
WORKDIR /app/apps/web
# Allow HTTP during build (Docker environment)
ENV SKIP_HTTPS_CHECK=true
RUN pnpm build

# Production stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy built app and dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/web/package.json ./apps/web/
COPY --from=builder /app/apps/web/next.config.mjs ./apps/web/

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    chown -R nextjs:nodejs /app

USER nextjs

WORKDIR /app/apps/web

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["pnpm", "start"]
