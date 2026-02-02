#!/bin/bash
# Unified Citewalk deploy: local/dev (full stack, no SSL) or production (full stack + SSL).
# Usage: ./scripts/deploy.sh [local|prod] [--web-only] [--no-cache]
#   local (default) - full stack, dev compose, migrations, MinIO setup, no SSL
#   prod           - full stack, prod compose, secret checks, SSL + cron, migrations
#   --web-only     - rebuild and restart only the web app (npm build + docker build web)
#   --no-cache     - pass --no-cache to docker build (useful for local)
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DOCKER_DIR="$PROJECT_ROOT/infra/docker"

# Parse arguments
MODE="${1:-local}"
WEB_ONLY=false
NO_CACHE=""
for arg in "$@"; do
  case "$arg" in
    --web-only) WEB_ONLY=true ;;
    --no-cache)  NO_CACHE="--no-cache" ;;
  esac
done

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

get_env() { grep -E "^${1}=" "$DOCKER_DIR/.env" 2>/dev/null | cut -d= -f2- | tr -d '\r' || true; }

# -----------------------------------------------------------------------------
# --web-only: rebuild and restart web app only
# -----------------------------------------------------------------------------
if [ "$WEB_ONLY" = true ]; then
  echo -e "${BLUE}🚀 Deploying Web App only...${NC}"
  cd "$PROJECT_ROOT"
  echo "📦 Building web app..."
  cd apps/web && npm install && npm run build && cd "$PROJECT_ROOT"
  echo "🐳 Building Docker image..."
  docker compose -f "$DOCKER_DIR/docker-compose.yml" build $NO_CACHE web
  echo "▶️  Starting web service..."
  docker compose -f "$DOCKER_DIR/docker-compose.yml" up -d web
  echo "⏳ Waiting for web app to be healthy..."
  timeout=60
  elapsed=0
  while [ $elapsed -lt $timeout ]; do
    if docker compose -f "$DOCKER_DIR/docker-compose.yml" ps web 2>/dev/null | grep -q "healthy\|Up"; then
      echo -e "${GREEN}✅ Web app is healthy!${NC}"
      exit 0
    fi
    sleep 2
    elapsed=$((elapsed + 2))
  done
  echo -e "${RED}❌ Web app failed to start within $timeout seconds${NC}"
  docker compose -f "$DOCKER_DIR/docker-compose.yml" logs web --tail 50
  exit 1
fi

# -----------------------------------------------------------------------------
# Full stack deploy (local or prod)
# -----------------------------------------------------------------------------
if [ "$MODE" = "prod" ]; then
  echo -e "${BLUE}🚀 Deploying to PRODUCTION${NC}"
  COMPOSE_FILES="-f docker-compose.yml -f docker-compose.prod.yml"
  MIGRATION_CMD="npm run migration:run:prod"
else
  echo -e "${BLUE}🚀 Deploying to LOCAL / DEV${NC}"
  COMPOSE_FILES="-f docker-compose.yml"
  MIGRATION_CMD="npm run migration:run"
fi

COMPOSE_CMD="docker compose $COMPOSE_FILES"

# Prerequisites: Docker
if ! docker info >/dev/null 2>&1; then
  echo -e "${RED}❌ Docker is not running. Please start Docker.${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Docker is running${NC}"

# Production: enable Docker on boot (Debian/Hetzner)
if [ "$MODE" = "prod" ] && command -v systemctl &>/dev/null; then
  echo -e "${BLUE}🐳 Ensuring Docker is enabled on boot...${NC}"
  sudo systemctl enable docker 2>/dev/null || true
  sudo systemctl start docker 2>/dev/null || true
  echo -e "${GREEN}✓ Docker enabled on boot${NC}"
fi

cd "$DOCKER_DIR"

# .env
if [ ! -f ".env" ]; then
  echo -e "${YELLOW}⚠️  .env not found. Creating from .env.example...${NC}"
  if [ -f ".env.example" ]; then
    cp .env.example .env
    echo "✅ Created .env. Please update it with your values."
    [ "$MODE" = "prod" ] && { echo "Fix .env and run again."; exit 1; }
    echo "Press Enter to continue or Ctrl+C to cancel..."
    read
  else
    echo -e "${RED}❌ .env.example not found. Create .env manually.${NC}"
    exit 1
  fi
fi

# Production: validate secrets and SSL
if [ "$MODE" = "prod" ]; then
  JWT_SECRET=$(get_env JWT_SECRET)
  METRICS_SECRET=$(get_env METRICS_SECRET)
  CITEWALK_ADMIN_SECRET=$(get_env CITEWALK_ADMIN_SECRET)
  CORS_ORIGINS=$(get_env CORS_ORIGINS)
  FRONTEND_URL=$(get_env FRONTEND_URL)
  ERR=0
  [ -z "$JWT_SECRET" ] || [ "$JWT_SECRET" = "your-secret-key-change-in-production" ] && { echo "❌ Set JWT_SECRET in .env"; ERR=1; }
  [ -z "$METRICS_SECRET" ] && { echo "❌ Set METRICS_SECRET in .env"; ERR=1; }
  [ -z "$CITEWALK_ADMIN_SECRET" ] || [ "$CITEWALK_ADMIN_SECRET" = "dev-admin-change-me" ] && { echo "❌ Set CITEWALK_ADMIN_SECRET in .env"; ERR=1; }
  [ -z "$CORS_ORIGINS" ] && { echo "❌ Set CORS_ORIGINS in .env"; ERR=1; }
  [ -z "$FRONTEND_URL" ] && { echo "❌ Set FRONTEND_URL in .env"; ERR=1; }
  [ -n "$FRONTEND_URL" ] && [ "${FRONTEND_URL%%:*}" = "http" ] && { echo "❌ FRONTEND_URL must use HTTPS in prod"; ERR=1; }
  [ $ERR -eq 1 ] && exit 1
  echo "✅ Production checks passed (secrets, CORS, FRONTEND_URL)"

  if [ ! -f "ssl/cert.pem" ] || [ ! -f "ssl/key.pem" ]; then
    echo "🔒 SSL certs not found. Running init-ssl-certbot.sh..."
    if [ -f "init-ssl-certbot.sh" ]; then
      chmod +x init-ssl-certbot.sh
      ./init-ssl-certbot.sh
    else
      echo "❌ init-ssl-certbot.sh not found. Place cert.pem and key.pem in ./ssl/ or set CERTBOT_EMAIL and run init-ssl-certbot.sh."
      exit 1
    fi
  fi
  if [ ! -f "ssl/cert.pem" ] || [ ! -f "ssl/key.pem" ]; then
    echo "❌ SSL certs still missing. Ensure port 80 is free and CERTBOT_EMAIL is set."
    exit 1
  fi
  echo "✅ SSL certificates ready (./ssl/)"
fi

# Volumes and script permissions
echo "📁 Creating volume directories..."
mkdir -p volumes/{db,neo4j/{data,logs},redis,meilisearch,minio,ollama,backups}
for script in backup-db.sh backup-full.sh restore-full.sh init-ssl-certbot.sh renew-ssl-cron.sh init-ollama.sh; do
  [ -f "$script" ] && chmod +x "$script"
done

# Build
echo "🔨 Building Docker images..."
$COMPOSE_CMD build $NO_CACHE

# Start
echo "🚀 Starting services..."
$COMPOSE_CMD up -d

echo "⏳ Waiting for services..."
sleep 10

# Migrations
echo "🔄 Running database migrations..."
if $COMPOSE_CMD exec -T api $MIGRATION_CMD 2>/dev/null; then
  echo -e "${GREEN}✅ Migrations completed${NC}"
else
  echo -e "${YELLOW}⚠️  Migrations may have failed or none to run${NC}"
fi

# Local: MinIO setup
if [ "$MODE" = "local" ] && [ -f "$PROJECT_ROOT/scripts/setup-minio.sh" ]; then
  echo "📦 Setting up MinIO bucket..."
  bash "$PROJECT_ROOT/scripts/setup-minio.sh" && echo -e "${GREEN}✅ MinIO configured${NC}" || true
fi

# Production: SSL renewal cron
if [ "$MODE" = "prod" ]; then
  DEPLOY_DIR="$DOCKER_DIR"
  CRON_LINE="0 3 * * * DEPLOY_PATH=$DEPLOY_DIR; [ -x \"\$DEPLOY_PATH/renew-ssl-cron.sh\" ] && CITEWALK_DOCKER_DIR=\$DEPLOY_PATH \$DEPLOY_PATH/renew-ssl-cron.sh >> /var/log/citewalk-ssl-renew.log 2>&1"
  if crontab -l 2>/dev/null | grep -q "renew-ssl-cron.sh"; then
    echo "✅ SSL renewal cron already installed."
  else
    if (crontab -l 2>/dev/null | grep -v "renew-ssl-cron.sh"; echo "$CRON_LINE") | crontab - 2>/dev/null; then
      echo "✅ SSL renewal cron installed (daily 3 AM)."
    else
      echo "⚠️  Install SSL renewal cron manually: (crontab -l; echo '$CRON_LINE') | crontab -"
    fi
  fi
fi

# Status and summary
echo ""
echo "📊 Service status:"
$COMPOSE_CMD ps
echo ""
echo "📋 Recent logs:"
$COMPOSE_CMD logs --tail=30
echo ""

if [ "$MODE" = "local" ]; then
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo -e "${GREEN}🎉 Local deployment complete${NC}"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  🌐 App:     http://localhost"
  echo "  🔌 API:     http://localhost/api"
  echo "  📝 Logs:    cd $DOCKER_DIR && $COMPOSE_CMD logs -f"
  echo "  🛑 Stop:    cd $DOCKER_DIR && $COMPOSE_CMD down"
else
  FRONTEND_URL=$(get_env FRONTEND_URL)
  echo -e "${GREEN}✅ Production deployment complete.${NC}"
  echo "  App:   ${FRONTEND_URL:-https://your-domain}"
  echo "  API:   ${FRONTEND_URL:-https://your-domain}/api"
  echo "  Logs:  cd $DOCKER_DIR && $COMPOSE_CMD logs -f"
fi
echo ""
