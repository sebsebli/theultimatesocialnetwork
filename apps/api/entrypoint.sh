#!/bin/sh
set -e
# Run migrations on every start (idempotent; safe on fresh deploy and restart)
echo "Running database migrations..."
node node_modules/typeorm/cli.js migration:run -d dist/database/data-source.js
if [ $? -ne 0 ]; then
  echo "Migration run failed. Exiting."
  exit 1
fi
exec node dist/main.js
