#!/bin/sh
set -e
# Run migrations on every start (idempotent; safe on fresh deploy and restart)
echo "Running database migrations..."
node node_modules/typeorm/cli.js migration:run -d dist/database/data-source.js || {
  echo "Migration run finished (may have failed or nothing to run). Continuing..."
}
exec node dist/main.js
