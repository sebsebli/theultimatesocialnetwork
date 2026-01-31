#!/bin/bash
# Auto-renew SSL certificates (for cron). Stops nginx, runs Certbot renew, starts nginx.
# Run from infra/docker or set CITEWALK_DOCKER_DIR. Logs to stderr/stdout (cron will capture).

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${CITEWALK_DOCKER_DIR:-$SCRIPT_DIR}"

COMPOSE_CMD="docker compose -f docker-compose.yml -f docker-compose.prod.yml"

$COMPOSE_CMD stop nginx 2>/dev/null || true
./init-ssl-certbot.sh --renew
$COMPOSE_CMD start nginx
