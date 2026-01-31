#!/bin/bash

# Citewalk System Docker Deployment Script
# Usage: ./deploy.sh [dev|prod]

set -e

ENVIRONMENT=${1:-dev}
COMPOSE_BASE="docker-compose.yml"
COMPOSE_OVERRIDE=""

if [ "$ENVIRONMENT" = "prod" ]; then
  COMPOSE_OVERRIDE="-f docker-compose.prod.yml"
  echo "🚀 Deploying to PRODUCTION environment"
else
  echo "🚀 Deploying to DEVELOPMENT environment"
fi

COMPOSE_CMD="docker compose -f $COMPOSE_BASE $COMPOSE_OVERRIDE"

# Check if .env exists
if [ ! -f ".env" ]; then
  echo "⚠️  .env file not found. Creating from .env.example..."
  if [ -f ".env.example" ]; then
    cp .env.example .env
    echo "✅ Created .env file. Please update it with your values."
    echo "⚠️  Press Enter to continue or Ctrl+C to cancel..."
    read
  else
    echo "❌ .env.example not found. Please create .env manually."
    exit 1
  fi
fi

# Production: validate required secrets; obtain SSL via Certbot if missing
if [ "$ENVIRONMENT" = "prod" ]; then
  get_env() { grep -E "^${1}=" .env 2>/dev/null | cut -d= -f2- | tr -d '\r' || true; }
  JWT_SECRET=$(get_env JWT_SECRET)
  METRICS_SECRET=$(get_env METRICS_SECRET)
  CITEWALK_ADMIN_SECRET=$(get_env CITEWALK_ADMIN_SECRET)
  ERR=0
  if [ -z "$JWT_SECRET" ] || [ "$JWT_SECRET" = "your-secret-key-change-in-production" ]; then
    echo "❌ Production requires JWT_SECRET to be set to a strong, non-default value in .env"
    ERR=1
  fi
  if [ -z "$METRICS_SECRET" ]; then
    echo "❌ Production requires METRICS_SECRET in .env (protects GET /metrics)"
    ERR=1
  fi
  if [ -z "$CITEWALK_ADMIN_SECRET" ] || [ "$CITEWALK_ADMIN_SECRET" = "dev-admin-change-me" ]; then
    echo "❌ Production requires CITEWALK_ADMIN_SECRET to be set to a strong value in .env"
    ERR=1
  fi
  if [ $ERR -eq 1 ]; then
    echo "Fix the above and run ./deploy.sh prod again."
    exit 1
  fi
  echo "✅ Production checks passed (JWT_SECRET, METRICS_SECRET, CITE_ADMIN_SECRET)"

  # Auto-generate SSL certs with Certbot if missing (domain: citewalk.com via CERTBOT_DOMAIN/CERTBOT_EMAIL in .env)
  if [ ! -f "ssl/cert.pem" ] || [ ! -f "ssl/key.pem" ]; then
    echo "🔒 SSL certs not found in ./ssl/. Running Certbot to obtain Let's Encrypt certificates..."
    if [ -f "init-ssl-certbot.sh" ]; then
      chmod +x init-ssl-certbot.sh
      ./init-ssl-certbot.sh
    else
      echo "❌ init-ssl-certbot.sh not found. Place cert.pem and key.pem in ./ssl/ or add CERTBOT_EMAIL to .env and run init-ssl-certbot.sh."
      exit 1
    fi
  fi
  if [ ! -f "ssl/cert.pem" ] || [ ! -f "ssl/key.pem" ]; then
    echo "❌ SSL certs still missing. Ensure port 80 is free and CERTBOT_EMAIL is set in .env, then run ./init-ssl-certbot.sh"
    exit 1
  fi
  echo "✅ SSL certificates ready (./ssl/cert.pem, key.pem)"
fi

# Create volumes directory if it doesn't exist
echo "📁 Creating volume directories..."
mkdir -p volumes/{db,neo4j/{data,logs},redis,meilisearch,minio,ollama,backups}

# Set permissions for backup/restore and SSL scripts
for script in backup-db.sh backup-full.sh restore-full.sh init-ssl-certbot.sh renew-ssl-cron.sh; do
  if [ -f "$script" ]; then
    chmod +x "$script"
  fi
done

if [ -f "init-ollama.sh" ]; then
  chmod +x init-ollama.sh
fi

# Build images
echo "🔨 Building Docker images..."
$COMPOSE_CMD build

# Start services
echo "🚀 Starting services..."
$COMPOSE_CMD up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
sleep 10

# Run migrations (use compiled dist in container; src/ is not in production image)
echo "🔄 Running database migrations..."
$COMPOSE_CMD exec -T api npm run migration:run:prod

# Check service status
echo "📊 Service status:"
$COMPOSE_CMD ps

# Show recent logs (run '$COMPOSE_CMD logs -f' to follow)
echo ""
echo "📋 Recent logs:"
$COMPOSE_CMD logs --tail=50
echo ""
echo "✅ Deploy complete. Run '$COMPOSE_CMD logs -f' to follow logs."
