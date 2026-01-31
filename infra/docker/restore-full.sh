#!/bin/bash
# Restore from a full backup (PostgreSQL + Neo4j + MinIO).
# Usage: ./restore-full.sh [path-to-full-backup-dir]
# Example: ./restore-full.sh volumes/backups/full_20250131_120000
#
# Prerequisites: run from infra/docker; .env loaded for credentials.
# For clean restore, stop the API first: docker compose stop api

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

BACKUP_DIR="${1:-}"
if [ -z "$BACKUP_DIR" ] || [ ! -d "$BACKUP_DIR" ]; then
  echo "Usage: $0 <path-to-full-backup-dir>"
  echo "Example: $0 volumes/backups/full_20250131_120000"
  echo ""
  echo "Available full backups:"
  ls -d volumes/backups/full_* 2>/dev/null || echo "  (none found)"
  exit 1
fi

# Resolve to absolute path for docker mount
BACKUP_DIR="$(cd "$BACKUP_DIR" && pwd)"
BACKUP_NAME="$(basename "$BACKUP_DIR")"

# Load .env if present
if [ -f .env ]; then
  set -a
  source .env
  set +a
fi

POSTGRES_DB="${POSTGRES_DB:-postgres}"
POSTGRES_USER="${POSTGRES_USER:-postgres}"
NEO4J_PASSWORD="${NEO4J_PASSWORD:-password}"
MINIO_BUCKET="${MINIO_BUCKET:-cite-images}"
MINIO_ROOT_USER="${MINIO_ROOT_USER:-minioadmin}"
MINIO_ROOT_PASSWORD="${MINIO_ROOT_PASSWORD:-minioadmin}"
MEILI_MASTER_KEY="${MEILI_MASTER_KEY:-masterKey}"
# From host, Meilisearch is at localhost:7700 (port exposed). Override with MEILISEARCH_RESTORE_URL if needed.
MEILISEARCH_URL="${MEILISEARCH_RESTORE_URL:-${MEILISEARCH_HOST:-http://localhost:7700}}"

PG_DUMP=$(find "$BACKUP_DIR" -maxdepth 1 -name "postgres_*.sql.gz" -type f | head -1)
NEO4J_CYPHER="${BACKUP_DIR}/neo4j.cypher"
MINIO_DIR="${BACKUP_DIR}/minio_${MINIO_BUCKET}"

echo "=============================================="
echo "Restoring from: $BACKUP_DIR"
echo "=============================================="

# -----------------------------------------------------------------------------
# 1. PostgreSQL
# -----------------------------------------------------------------------------
if [ -n "$PG_DUMP" ] && [ -f "$PG_DUMP" ]; then
  echo "[1/4] Restoring PostgreSQL..."
  docker compose exec -T db psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "
    DROP SCHEMA IF EXISTS public CASCADE;
    CREATE SCHEMA public;
    GRANT ALL ON SCHEMA public TO $POSTGRES_USER;
    GRANT ALL ON SCHEMA public TO public;
  " 2>/dev/null || true
  gunzip -c "$PG_DUMP" | docker compose exec -T db psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -q
  echo "      PostgreSQL restore done."
else
  echo "[1/4] No PostgreSQL dump found in backup; skipping."
fi

# -----------------------------------------------------------------------------
# 2. Neo4j (clear + run Cypher export)
# -----------------------------------------------------------------------------
if [ -s "$NEO4J_CYPHER" ]; then
  echo "[2/4] Restoring Neo4j..."
  # Clear existing graph (optional: skip if file is empty or comment-only)
  docker compose exec -T neo4j cypher-shell -u neo4j -p "$NEO4J_PASSWORD" --format plain \
    "MATCH (n) DETACH DELETE n;" 2>/dev/null || true
  # Run backup Cypher (path inside container: /backups is mounted from volumes/backups)
  CONTAINER_CYPHER="/backups/${BACKUP_NAME}/neo4j.cypher"
  docker compose exec -T neo4j cypher-shell -u neo4j -p "$NEO4J_PASSWORD" -f "$CONTAINER_CYPHER" 2>/dev/null || true
  echo "      Neo4j restore done."
else
  echo "[2/4] No Neo4j Cypher file or empty; skipping."
fi

# -----------------------------------------------------------------------------
# 3. MinIO (mirror backup into bucket)
# -----------------------------------------------------------------------------
if [ -d "$MINIO_DIR" ]; then
  echo "[3/4] Restoring MinIO bucket (${MINIO_BUCKET})..."
  docker run --rm --network cite-network \
    -v "$BACKUP_DIR:/restore:ro" \
    -e "MC_HOST_minio=http://minio:9000" \
    minio/mc:latest \
    sh -c "mc alias set minio http://minio:9000 $MINIO_ROOT_USER $MINIO_ROOT_PASSWORD && mc mirror /restore/minio_${MINIO_BUCKET} minio/${MINIO_BUCKET} --overwrite"
  echo "      MinIO restore done."
else
  echo "[3/4] No MinIO backup dir found; skipping."
fi

# -----------------------------------------------------------------------------
# 4. Meilisearch (clear indexes so API auto-reindexes from PostgreSQL on start)
# -----------------------------------------------------------------------------
echo "[4/4] Clearing Meilisearch indexes (API will auto-reindex on start)..."
for index in posts users topics messages; do
  curl -s -X DELETE "${MEILISEARCH_URL}/indexes/${index}/documents" \
    -H "Authorization: Bearer ${MEILI_MASTER_KEY}" \
    --max-time 10 >/dev/null 2>&1 || true
done
echo "      Meilisearch cleared. Start API: docker compose start api"

echo "=============================================="
echo "Restore finished. Start API: docker compose start api"
echo "API will automatically reindex Meilisearch from PostgreSQL."
echo "=============================================="
