#!/bin/bash
set -e

echo "🚀 Deploying Web App..."

cd "$(dirname "$0")/.."

# Build web app
echo "📦 Building web app..."
cd apps/web
npm install
npm run build

# Build Docker image
echo "🐳 Building Docker image..."
cd ../..
docker compose -f infra/docker/docker-compose.yml build web

# Start web service
echo "▶️  Starting web service..."
docker compose -f infra/docker/docker-compose.yml up -d web

# Wait for health check
echo "⏳ Waiting for web app to be healthy..."
timeout=60
elapsed=0
while [ $elapsed -lt $timeout ]; do
    if docker compose -f infra/docker/docker-compose.yml ps web | grep -q "healthy\|Up"; then
        echo "✅ Web app is healthy!"
        exit 0
    fi
    sleep 2
    elapsed=$((elapsed + 2))
done

echo "❌ Web app failed to start within $timeout seconds"
docker compose -f infra/docker/docker-compose.yml logs web --tail 50
exit 1
