#!/bin/bash
# Fresh Docker deploy: tear down all containers and volume data, then bring up (no demo seeding).

set -e
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT/infra/docker"

echo "🛑 Stopping and removing all containers..."
docker compose down

echo "🗑️  Removing volume data (db, neo4j, redis, meilisearch, minio)..."
rm -rf volumes/db volumes/neo4j volumes/redis volumes/meilisearch volumes/minio
# Keep: volumes/backups, volumes/ollama (avoid re-downloading models)

echo "🚀 Starting fresh stack..."
docker compose up -d

echo "⏳ Waiting for DB to be ready..."
for i in {1..30}; do
  if docker compose exec -T db pg_isready -U postgres -q 2>/dev/null; then
    echo "   DB is ready."
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo "   Timeout waiting for DB."
    exit 1
  fi
  sleep 2
done

echo "🔄 Running migrations..."
docker compose exec -T api npm run migration:run

echo ""
echo "✅ Fresh deploy complete."
docker compose ps
