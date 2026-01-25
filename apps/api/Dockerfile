# Multi-stage build for production
FROM node:20-slim AS builder

WORKDIR /app

# Install system dependencies for native modules (sharp, etc.)
RUN apt-get update && apt-get install -y \
    libvips-dev \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Install pnpm
RUN npm install -g pnpm@8.15.1

# Copy workspace root files
COPY package.json pnpm-workspace.yaml .npmrc ./
COPY pnpm-lock.yaml* ./

# Copy API package files
COPY apps/api/package.json ./apps/api/
COPY apps/api/tsconfig*.json ./apps/api/
COPY apps/api/nest-cli.json ./apps/api/

# Install dependencies (including dev for build)
RUN pnpm install --filter api --include=dev --no-optional

# Copy API source code
COPY apps/api/src ./apps/api/src

# Build
WORKDIR /app/apps/api
RUN pnpm build

# Production stage
FROM node:20-slim AS production

WORKDIR /app

# Install system dependencies for runtime (sharp needs libvips)
RUN apt-get update && apt-get install -y \
    libvips-dev \
    && rm -rf /var/lib/apt/lists/*

# Install pnpm
RUN npm install -g pnpm@8.15.1

# Copy workspace root files
COPY package.json pnpm-workspace.yaml .npmrc ./
COPY pnpm-lock.yaml* ./

# Copy API package files
COPY apps/api/package.json ./apps/api/
COPY apps/api/tsconfig*.json ./apps/api/

# Install dependencies including dev (needed for migrations/seeding)
# We need dev dependencies for operational tasks
RUN pnpm install --filter api --include=dev --no-optional

# Copy built application from builder
COPY --from=builder /app/apps/api/dist ./apps/api/dist

# Use existing node user
RUN chown -R node:node /app
USER node

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start
WORKDIR /app/apps/api
CMD ["node", "dist/main.js"]
