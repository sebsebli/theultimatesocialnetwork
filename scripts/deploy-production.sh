#!/bin/bash

# Production Deployment Script — Debian / Hetzner
# Enables Docker on boot, then runs the production stack (nginx-only exposure, SSL, migrations, cron).
# Run from repo root: ./scripts/deploy-production.sh

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

echo -e "${BLUE}🚀 Production Deployment (Debian / Hetzner)${NC}\n"

# -----------------------------------------------------------------------------
# Step 0: Enable Docker on boot (Debian/Hetzner) so the stack persists across reboots
# -----------------------------------------------------------------------------
if command -v systemctl &>/dev/null; then
  echo -e "${BLUE}🐳 Ensuring Docker is enabled on boot and running...${NC}"
  if systemctl is-system-running &>/dev/null 2>&1 || [ -d /run/systemd/system ]; then
    sudo systemctl enable docker
    sudo systemctl start docker 2>/dev/null || true
    echo -e "${GREEN}✓ Docker enabled on boot and started${NC}\n"
  fi
else
  echo -e "${YELLOW}⚠ systemctl not found (not systemd); skipping 'systemctl enable docker'${NC}\n"
fi

# -----------------------------------------------------------------------------
# Step 1: Prerequisites
# -----------------------------------------------------------------------------
echo -e "${BLUE}📋 Checking prerequisites...${NC}"

if ! command -v docker &>/dev/null; then
  echo -e "${RED}✗ Docker is not installed. On Debian: sudo apt-get update && sudo apt-get install -y docker.io${NC}"
  exit 1
fi

if ! docker compose version &>/dev/null 2>&1; then
  if ! command -v docker-compose &>/dev/null; then
    echo -e "${RED}✗ Docker Compose is not installed. On Debian: sudo apt-get install -y docker-compose-plugin${NC}"
    exit 1
  fi
fi

echo -e "${GREEN}✓ Prerequisites met${NC}\n"

# -----------------------------------------------------------------------------
# Step 2: Run production deploy from infra/docker (SSL, prod compose, migrations, cron)
# -----------------------------------------------------------------------------
echo -e "${BLUE}🏗️  Running production deploy (infra/docker)...${NC}"
cd "$DOCKER_DIR"

if [ ! -f "deploy.sh" ]; then
  echo -e "${RED}✗ infra/docker/deploy.sh not found${NC}"
  exit 1
fi

chmod +x deploy.sh
./deploy.sh prod

# -----------------------------------------------------------------------------
# Step 3: Smoke test via nginx (production exposes only nginx; test localhost on server)
# -----------------------------------------------------------------------------
echo -e "\n${BLUE}🧪 Smoke test (via nginx)...${NC}"

get_env() { grep -E "^${1}=" .env 2>/dev/null | cut -d= -f2- | tr -d '\r' || true; }
FRONTEND_URL=$(get_env FRONTEND_URL)

# Test nginx and API on localhost (script runs on the server)
if curl -s -f -k "http://localhost/health" >/dev/null 2>&1; then
  echo -e "${GREEN}✓ Nginx health: http://localhost/health${NC}"
elif curl -s -f -k "http://localhost/api/health" >/dev/null 2>&1; then
  echo -e "${GREEN}✓ API health: http://localhost/api/health${NC}"
else
  echo -e "${YELLOW}⚠ Could not reach localhost/health or localhost/api/health (check nginx and api logs)${NC}"
fi

# -----------------------------------------------------------------------------
# Step 4: Summary
# -----------------------------------------------------------------------------
echo -e "\n${BLUE}📊 Service status${NC}"
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps

echo -e "\n${BLUE}🔗 Production (only nginx exposed)${NC}"
echo "  App:         ${FRONTEND_URL:-https://your-domain}"
echo "  API:         ${FRONTEND_URL:-https://your-domain}/api"
echo "  On server:   http://localhost/health  http://localhost/api/health"

echo -e "\n${GREEN}✅ Production deployment complete.${NC}"
echo -e "Docker is enabled on boot; stack will come back after reboots."
echo -e "Logs:  cd $DOCKER_DIR && docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f"
echo ""
