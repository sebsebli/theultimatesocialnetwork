#!/bin/sh
set -e

# ── Wait for database connectivity before migrations ──
MAX_DB_WAIT=30
echo "Waiting for database to be ready..."
for i in $(seq 1 $MAX_DB_WAIT); do
  if node -e "
    const { DataSource } = require('typeorm');
    const ds = require('./dist/database/data-source.js').default || require('./dist/database/data-source.js').AppDataSource;
    ds.initialize().then(() => { ds.destroy(); process.exit(0); }).catch(() => process.exit(1));
  " 2>/dev/null; then
    echo "Database is ready."
    break
  fi
  if [ "$i" = "$MAX_DB_WAIT" ]; then
    echo "Database not ready after ${MAX_DB_WAIT}s. Proceeding with migration (may fail)..."
  fi
  sleep 1
done

# ── Run migrations with retry (handles transient failures) ──
MAX_RETRIES=3
RETRY_DELAY=5
echo "Running database migrations..."
for attempt in $(seq 1 $MAX_RETRIES); do
  if node node_modules/typeorm/cli.js migration:run -d dist/database/data-source.js; then
    echo "Migrations completed successfully."
    break
  fi
  if [ "$attempt" = "$MAX_RETRIES" ]; then
    echo "Migration failed after $MAX_RETRIES attempts. Exiting."
    exit 1
  fi
  echo "Migration attempt $attempt failed. Retrying in ${RETRY_DELAY}s..."
  sleep $RETRY_DELAY
done

exec node dist/main.js
