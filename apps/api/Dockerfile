FROM node:20-slim

WORKDIR /app

# Install system dependencies for native modules (sharp, etc.)
RUN apt-get update && apt-get install -y \
    libvips-dev \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Install pnpm
RUN npm install -g pnpm

# Copy workspace root files
COPY package.json pnpm-workspace.yaml ./
COPY pnpm-lock.yaml* ./

# Copy API package files
COPY apps/api/package.json ./apps/api/
COPY apps/api/tsconfig*.json ./apps/api/
COPY apps/api/nest-cli.json ./apps/api/

# Install dependencies from workspace root (including dev for build)
# Install with ignore-scripts to avoid inotify build issues
RUN pnpm install --filter api --include=dev --ignore-scripts || pnpm install --filter api --include=dev --no-optional
# Note: Sharp may need manual installation - image uploads may not work until sharp is properly installed
# To fix: docker exec -it cite-api sh -c "cd /app/apps/api && pnpm add sharp@0.32.6 --force"

# Copy API source code
COPY apps/api/src ./apps/api/src

# Build
WORKDIR /app/apps/api
RUN pnpm build

# Expose port
EXPOSE 3000

# Start (keep all dependencies for runtime - Docker image size is acceptable)
WORKDIR /app/apps/api
CMD ["node", "dist/main.js"]
