#!/bin/bash
# Wrapper: production deploy (SSL, secrets, cron). See scripts/deploy.sh for the unified deploy script.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec "$SCRIPT_DIR/deploy.sh" prod "$@"
