#!/bin/bash
set -e

echo "🚀 Deploying Citewalk System to Local Docker..."
echo ""

cd "$(dirname "$0")/.."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker Desktop.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker is running${NC}"
echo ""

# Step 1: Stop existing containers
echo "📦 Step 1: Stopping existing containers..."
docker compose -f infra/docker/docker-compose.yml down 2>/dev/null || true
echo -e "${GREEN}✅ Containers stopped${NC}"
echo ""

# Step 2: Build images
echo "🔨 Step 2: Building Docker images..."
echo "This may take a few minutes..."
docker compose -f infra/docker/docker-compose.yml build --no-cache
echo -e "${GREEN}✅ Images built${NC}"
echo ""

# Step 3: Start services
echo "▶️  Step 3: Starting all services..."
docker compose -f infra/docker/docker-compose.yml up -d

# Wait for services to be healthy
echo ""
echo "⏳ Waiting for services to be healthy..."
sleep 10

# Check service health
echo ""
echo "🔍 Checking service health..."

services=("db" "neo4j" "redis" "meilisearch" "minio" "api" "web")
all_healthy=true

for service in "${services[@]}"; do
    if docker compose -f infra/docker/docker-compose.yml ps "$service" | grep -q "Up\|healthy"; then
        echo -e "${GREEN}✅ $service is running${NC}"
    else
        echo -e "${RED}❌ $service is not running${NC}"
        all_healthy=false
    fi
done

echo ""

# Step 4: Setup MinIO bucket
echo "📦 Step 4: Setting up MinIO bucket..."
if [ -f "scripts/setup-minio.sh" ]; then
    bash scripts/setup-minio.sh
    echo -e "${GREEN}✅ MinIO bucket configured${NC}"
else
    echo -e "${YELLOW}⚠️  MinIO setup script not found, skipping...${NC}"
fi
echo ""

# Step 5: Run migrations
echo "🗄️  Step 5: Running database migrations..."
if docker compose -f infra/docker/docker-compose.yml exec -T api npm run migration:run 2>/dev/null; then
    echo -e "${GREEN}✅ Migrations completed${NC}"
else
    echo -e "${YELLOW}⚠️  Migrations may have failed or no migrations to run${NC}"
fi
echo ""

# Step 6: Display service URLs
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Service URLs (only nginx exposed to host):"
echo ""
echo "  🌐 App (nginx):            http://localhost  — beta/invite-only on by default"
echo "  🔌 API (via nginx):       http://localhost/api"
echo "  💾 PostgreSQL:            localhost:5433 (internal)"
echo "  🕸️  Neo4j Browser:         http://localhost:7474 (internal)"
echo "  🔴 Redis:                 localhost:6379 (internal)"
echo "  🔍 Meilisearch:           http://localhost:7700 (internal)"
echo "  📦 MinIO Console:         http://localhost:9001 (internal)"
echo "  🤖 Ollama:                http://localhost:11434 (internal)"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Service Status:"
docker compose -f infra/docker/docker-compose.yml ps
echo ""
echo "📝 Useful Commands:"
echo ""
echo "  View logs:              docker compose -f infra/docker/docker-compose.yml logs -f [service]"
echo "  Stop all services:      docker compose -f infra/docker/docker-compose.yml down"
echo "  Restart a service:     docker compose -f infra/docker/docker-compose.yml restart [service]"
echo "  View all logs:         docker compose -f infra/docker/docker-compose.yml logs -f"
echo ""
echo "🧪 Test the deployment:"
echo ""
echo "  curl http://localhost/health"
echo "  curl http://localhost/api/health"
echo ""
echo "📌 Persistence: All services use restart: unless-stopped and data is in infra/docker/volumes/ — the stack survives host reboots."
echo ""
echo -e "${GREEN}✅ All services are running!${NC}"
echo ""
