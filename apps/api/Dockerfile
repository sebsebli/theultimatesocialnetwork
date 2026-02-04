# Multi-stage build for production (npm, standalone app)
FROM node:20-slim AS builder

WORKDIR /app

# Install system dependencies for native modules (sharp, etc.)
RUN apt-get update && apt-get install -y \
    libvips-dev \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy API package files (standalone npm app)
COPY apps/api/package.json apps/api/package-lock.json* ./

# Install dependencies (including dev for build)
RUN npm ci --legacy-peer-deps --ignore-scripts --no-optional || npm install --legacy-peer-deps --ignore-scripts --no-optional
RUN npm rebuild sharp || true

# Copy API source
COPY apps/api/ ./

# Build
RUN npm run build

# Production stage
FROM node:20-slim AS production

WORKDIR /app

# Install system dependencies for runtime (sharp needs libvips)
RUN apt-get update && apt-get install -y \
    libvips-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy API package files
COPY apps/api/package.json apps/api/package-lock.json* ./

# Install dependencies including dev (needed for migrations/seeding)
RUN npm ci --legacy-peer-deps --ignore-scripts --no-optional || npm install --legacy-peer-deps --ignore-scripts --no-optional
RUN npm rebuild sharp || true

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Entrypoint: run migrations then start app (ensures migrations run on every deploy/restart)
COPY apps/api/entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Use existing node user (after chmod so entrypoint is executable)
RUN chown -R node:node /app
USER node

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

WORKDIR /app
ENTRYPOINT ["/app/entrypoint.sh"]
