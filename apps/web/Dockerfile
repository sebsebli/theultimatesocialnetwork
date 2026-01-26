# Multi-stage build for Next.js web app (standalone)
FROM node:20-alpine AS base

# Install pnpm
RUN npm install -g pnpm@8.15.1

# Install dependencies
FROM base AS deps
WORKDIR /app

# Copy web app package.json
COPY package.json ./

# Install dependencies for web app
RUN pnpm install

# Build stage
FROM base AS builder
WORKDIR /app

# Copy node_modules from deps
COPY --from=deps /app/node_modules ./node_modules

# Copy web app source (excluding node_modules and build artifacts)
# Use .dockerignore or explicit copy of needed files
COPY package.json ./
COPY next.config.mjs ./
COPY tsconfig.json ./
COPY postcss.config.mjs ./
COPY tailwind.config.js ./
COPY middleware.ts ./
COPY eslint.config.mjs ./
COPY public ./public
COPY app ./app
COPY components ./components
COPY lib ./lib
COPY utils ./utils

# Build
WORKDIR /app
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
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./
COPY --from=builder /app/next.config.mjs ./

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    chown -R nextjs:nodejs /app

USER nextjs

WORKDIR /app

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["pnpm", "start"]
