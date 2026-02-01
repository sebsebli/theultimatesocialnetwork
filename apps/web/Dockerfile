# Next.js web app (npm, standalone)
# Build context: repo root (so packages/design-tokens is available)
FROM node:20-alpine AS base

# Install dependencies
FROM base AS deps
WORKDIR /app

# Design-tokens: put under /app so "file:./packages/design-tokens" works
RUN mkdir -p packages
COPY packages/design-tokens ./packages/design-tokens
COPY apps/web/package.json ./
# Point design-tokens to local path; omit lockfile to avoid npm "extraneous" bug with file: deps
RUN sed -i 's|"file:../../packages/design-tokens"|"file:./packages/design-tokens"|g' package.json
RUN npm install --ignore-scripts

# Build stage (NEXT_PUBLIC_* must be set at build time; passed from compose build args)
FROM base AS builder
WORKDIR /app

ARG NEXT_PUBLIC_API_URL=http://localhost/api
ARG NEXT_PUBLIC_BETA_ACTIVE=true
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_BETA_ACTIVE=$NEXT_PUBLIC_BETA_ACTIVE

RUN mkdir -p packages node_modules/@citewalk
COPY packages/design-tokens ./packages/design-tokens
COPY --from=deps /app/node_modules ./node_modules
COPY apps/web/ .
# Ensure @citewalk/design-tokens is resolvable (after apps/web so tailwind.config.js can require it)
COPY packages/design-tokens ./node_modules/@citewalk/design-tokens

ENV SKIP_HTTPS_CHECK=true
RUN npm run build

# Production stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./
COPY --from=builder /app/next.config.mjs ./

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["npm", "start"]
