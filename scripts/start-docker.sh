#!/bin/bash

# Start Docker Compose for CITE System

echo "🚀 Starting CITE System Docker containers..."

cd infra/docker

# Check if .env exists
if [ ! -f .env ]; then
  echo "📝 Creating .env file from template..."
  cat > .env << EOF
POSTGRES_DB=postgres
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
NEO4J_PASSWORD=password
MEILI_MASTER_KEY=masterKey
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin
JWT_SECRET=your-secret-key-change-in-production
DEV_TOKEN=
EOF
  echo "✅ Created .env file. Please update DEV_TOKEN if needed."
fi

# Start services
docker compose up -d

echo ""
echo "⏳ Waiting for services to be healthy..."
sleep 10

# Check service health
echo ""
echo "🔄 Running database migrations..."
docker compose exec -T api npm run migration:run

echo ""
echo "📊 Service Status:"
docker compose ps

echo ""
echo "✅ Services started!"
echo ""
echo "📍 Service URLs:"
echo "  - API: http://localhost:3000"
echo "  - Web: http://localhost:3001"
echo "  - Neo4j Browser: http://localhost:7474"
echo "  - MinIO Console: http://localhost:9001"
echo "  - Meilisearch: http://localhost:7700"
echo ""
echo "🔑 MinIO Credentials:"
echo "  - Access Key: minioadmin"
echo "  - Secret Key: minioadmin"
echo ""
echo "To view logs: docker compose logs -f [service-name]"
echo "To stop: docker compose down"
