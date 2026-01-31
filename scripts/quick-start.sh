#!/bin/bash
set -e

echo "🚀 Quick Start - Citewalk System Local Docker"
echo ""

cd "$(dirname "$0")/.."

# Check Docker
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop."
    exit 1
fi

echo "✅ Docker is running"
echo ""

# Start services (will build if needed)
echo "📦 Starting all services..."
docker compose -f infra/docker/docker-compose.yml up -d

echo ""
echo "⏳ Waiting for services to start..."
sleep 15

echo ""
echo "📊 Service Status:"
docker compose -f infra/docker/docker-compose.yml ps

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 Services Started!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📍 Access URLs:"
echo ""
echo "  🌐 Web App:              http://localhost:3001"
echo "  🌐 Web (via nginx):      http://localhost"
echo "  🔌 API:                  http://localhost:3000"
echo "  🔌 API (via nginx):      http://localhost/api"
echo "  💾 PostgreSQL:           localhost:5433"
echo "  🕸️  Neo4j Browser:        http://localhost:7474"
echo "  🔍 Meilisearch:          http://localhost:7700"
echo "  📦 MinIO Console:        http://localhost:9001"
echo ""
echo "📝 Useful Commands:"
echo ""
echo "  View logs:    docker compose -f infra/docker/docker-compose.yml logs -f [service]"
echo "  Stop all:     docker compose -f infra/docker/docker-compose.yml down"
echo "  Restart:      docker compose -f infra/docker/docker-compose.yml restart [service]"
echo ""
echo "🧪 Test:"
echo "  curl http://localhost:3000/health"
echo "  curl http://localhost:3001"
echo ""
