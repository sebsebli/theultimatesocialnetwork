#!/bin/bash
# Reset Docker stack: stop containers, wipe all persisted data (db, neo4j, redis,
# meilisearch, minio, ollama, backups), then start fresh. Use for a clean slate.
#
# Run from repo root: ./scripts/reset-docker.sh [--rebuild]
#   (default)     - stop, wipe volumes, start (no image rebuild)
#   --rebuild     - also run "docker compose build --no-cache" before starting
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DOCKER_DIR="$PROJECT_ROOT/infra/docker"

REBUILD=false
for arg in "$@"; do
  case "$arg" in
    --rebuild) REBUILD=true ;;
  esac
done

echo "🛑 Stopping Docker Compose..."
cd "$DOCKER_DIR"
docker compose down

echo "🗑️  Removing all persisted data (volumes/db, neo4j, redis, meilisearch, minio, ollama, backups)..."
rm -rf "$DOCKER_DIR/volumes/"*

if [ "$REBUILD" = true ]; then
  echo "🔨 Rebuilding images..."
  docker compose build --no-cache
fi

echo "🚀 Starting stack..."
docker compose up -d

echo ""
echo "⏳ Waiting for services to be healthy..."
sleep 10

echo ""
echo "🔄 Running database migrations..."
docker compose exec -T api npm run migration:run 2>/dev/null || true

echo ""
echo "📊 Service status:"
docker compose ps

echo ""
echo "✅ Reset complete. Stack is running with empty DB, Neo4j, Meilisearch, MinIO, Redis, etc."
