#!/bin/bash

# CITE System Docker Deployment Script
# Usage: ./deploy.sh [dev|prod]

set -e

ENVIRONMENT=${1:-dev}
COMPOSE_FILE="docker-compose.yml"

if [ "$ENVIRONMENT" = "prod" ]; then
  COMPOSE_FILE="docker-compose.yml -f docker-compose.prod.yml"
  echo "🚀 Deploying to PRODUCTION environment"
else
  echo "🚀 Deploying to DEVELOPMENT environment"
fi

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

# Create volumes directory if it doesn't exist
echo "📁 Creating volume directories..."
mkdir -p volumes/{db,neo4j/{data,logs},redis,meilisearch,minio,ollama,backups}

# Set permissions for backup script
if [ -f "backup-db.sh" ]; then
  chmod +x backup-db.sh
fi

if [ -f "init-ollama.sh" ]; then
  chmod +x init-ollama.sh
fi

# Build images
echo "🔨 Building Docker images..."
docker compose -f $COMPOSE_FILE build

# Start services
echo "🚀 Starting services..."
docker compose -f $COMPOSE_FILE up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
sleep 10

# Run migrations (use compiled dist in container; src/ is not in production image)
echo "🔄 Running database migrations..."
docker compose -f $COMPOSE_FILE exec -T api npm run migration:run:prod

# Check service status
echo "📊 Service status:"
docker compose -f $COMPOSE_FILE ps

# Show recent logs (run 'docker compose -f $COMPOSE_FILE logs -f' to follow)
echo ""
echo "📋 Recent logs:"
docker compose -f $COMPOSE_FILE logs --tail=50
echo ""
echo "✅ Deploy complete. Run 'docker compose -f $COMPOSE_FILE logs -f' to follow logs."
