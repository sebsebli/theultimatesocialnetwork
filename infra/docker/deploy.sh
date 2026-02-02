#!/bin/bash
# Wrapper: run unified deploy from repo root. Usage: ./deploy.sh [dev|prod]
# See scripts/deploy.sh for the full deploy script (local = dev, prod = prod).
set -e
DEPLOY_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$DEPLOY_DIR/../.." && pwd)"
ENV="${1:-dev}"
[ "$ENV" = "dev" ] && ENV=local
exec "$PROJECT_ROOT/scripts/deploy.sh" "$ENV" "${@:2}"
