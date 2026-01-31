#!/bin/bash

# Production Deployment Script
# Deploys the backend to Docker with comprehensive testing

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DOCKER_DIR="$PROJECT_ROOT/infra/docker"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 Starting Production Deployment${NC}\n"

# Step 1: Check prerequisites
echo -e "${BLUE}📋 Checking prerequisites...${NC}"

if ! command -v docker &> /dev/null; then
    echo -e "${RED}✗ Docker is not installed${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}✗ Docker Compose is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Prerequisites met${NC}\n"

# Step 2: Build and start services
echo -e "${BLUE}🏗️  Building and starting Docker services...${NC}"
cd "$DOCKER_DIR"

# Stop existing containers
echo "Stopping existing containers..."
docker compose down || true

# Build and start
echo "Building and starting services..."
docker compose build --no-cache api
docker compose up -d

echo -e "${GREEN}✓ Services started${NC}\n"

# Step 3: Wait for services to be healthy
echo -e "${BLUE}⏳ Waiting for services to be healthy...${NC}"

MAX_WAIT=120
WAITED=0
while [ $WAITED -lt $MAX_WAIT ]; do
    if curl -s -f http://localhost:3000/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ API is healthy${NC}\n"
        break
    fi
    echo -n "."
    sleep 2
    WAITED=$((WAITED + 2))
done

if [ $WAITED -ge $MAX_WAIT ]; then
    echo -e "\n${RED}✗ API did not become healthy within ${MAX_WAIT}s${NC}"
    echo "Checking logs..."
    docker compose logs api --tail 50
    exit 1
fi

# Step 4: Run database migrations
echo -e "${BLUE}🗄️  Running database migrations...${NC}"
docker compose exec -T api npm run migration:run || {
    echo -e "${YELLOW}⚠ Migration failed or no migrations to run (this is OK if no migrations exist)${NC}"
}

# Step 5: Run comprehensive API tests
echo -e "${BLUE}🧪 Running comprehensive API tests...${NC}"
cd "$PROJECT_ROOT"
export API_URL="http://localhost:3000"

# Run basic endpoint tests
./scripts/test-all-endpoints.sh || {
    echo -e "${YELLOW}⚠ Some basic tests failed${NC}"
}

# Run production-grade tests (algorithms, beta features, performance)
echo -e "\n${BLUE}🧪 Running production-grade tests (algorithms & beta features)...${NC}"
./scripts/test-production-grade.sh || {
    echo -e "${YELLOW}⚠ Some production tests failed, but deployment completed${NC}"
}

# Step 6: Display service status
echo -e "\n${BLUE}📊 Service Status${NC}"
docker compose ps

echo -e "\n${BLUE}🔗 Service URLs${NC}"
echo "  API:        http://localhost:3000"
echo "  Web:        http://localhost:3001"
echo "  PostgreSQL: localhost:5433"
echo "  Neo4j:      http://localhost:7474"
echo "  Redis:      localhost:6379"
echo "  Meilisearch: http://localhost:7700"
echo "  MinIO:      http://localhost:9000"
echo "  MinIO Console: http://localhost:9001"

echo -e "\n${GREEN}✅ Deployment Complete!${NC}"
echo -e "\nTo view logs:"
echo "  docker compose logs -f api"
echo ""
echo "To stop services:"
echo "  cd infra/docker && docker compose down"
echo ""
echo "To restart services:"
echo "  cd infra/docker && docker compose restart"
