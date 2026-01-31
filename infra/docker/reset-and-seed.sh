#!/bin/bash
# Reset DB (delete volumes), deploy, then run comprehensive seed with indexed content and header images.
# Usage: ./reset-and-seed.sh [dev|prod]

set -e

ENVIRONMENT=${1:-dev}
COMPOSE_FILE="docker-compose.yml"
if [ "$ENVIRONMENT" = "prod" ]; then
  COMPOSE_FILE="docker-compose.yml -f docker-compose.prod.yml"
fi

echo "🗑️  Stopping services and removing volumes (database will be deleted)..."
docker compose -f $COMPOSE_FILE down -v

echo "🚀 Deploying (build, up, migrations)..."
./deploy.sh "$ENVIRONMENT"

echo "⏳ Waiting for API to be healthy..."
for i in $(seq 1 45); do
  if curl -sf http://localhost:3000/health >/dev/null 2>&1; then
    echo "   API is ready."
    break
  fi
  if [ "$i" -eq 45 ]; then
    echo "❌ API did not become healthy in time."
    exit 1
  fi
  sleep 2
done

echo "🌱 Running comprehensive seed (demo data + avatars, header images, Meilisearch, Neo4j)..."
docker compose -f $COMPOSE_FILE exec -T api npm run seed:comprehensive:prod

echo "🪣 Setting MinIO bucket cite-images to public read (so image URLs work)..."
docker compose -f $COMPOSE_FILE exec -T minio sh -c 'mc alias set local http://localhost:9000 minioadmin minioadmin 2>/dev/null; mc anonymous set download local/cite-images 2>/dev/null' 2>/dev/null || echo "   (MinIO public policy skipped; images may need auth)"

echo ""
echo "✅ Reset and seed complete. Demo data: users with avatars, posts with header images, follows, replies, Neo4j and Meilisearch indexed."
