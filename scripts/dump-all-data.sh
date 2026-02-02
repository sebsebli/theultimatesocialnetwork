#!/bin/bash
# Dump all data: PostgreSQL, Neo4j, Meilisearch, MinIO, Redis, and raw volume files.
# Requires a confirmation password before proceeding.
# Output: infra/docker/volumes/backups/full_YYYYMMDD_HHMMSS/ (restore with restore-full.sh)
#
# Usage: ./scripts/dump-all-data.sh
# Prerequisites: run from repo root; Docker stack running; .env in infra/docker for credentials.

set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT/infra/docker"

# -----------------------------------------------------------------------------
# Require confirmation password
# -----------------------------------------------------------------------------
echo "This will dump all data: PostgreSQL, Neo4j, Meilisearch, MinIO, Redis, and volume files."
echo -n "Enter password to confirm and proceed: "
read -rs CONFIRM
echo
if [ -z "$CONFIRM" ]; then
  echo "Aborted (no password entered)."
  exit 1
fi

# Load .env for credentials
if [ -f .env ]; then
  set -a
  source .env
  set +a
fi

POSTGRES_DB="${POSTGRES_DB:-postgres}"
POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_HOST="${POSTGRES_HOST:-db}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
NEO4J_PASSWORD="${NEO4J_PASSWORD:-password}"
MEILI_MASTER_KEY="${MEILI_MASTER_KEY:-masterKey}"
MINIO_BUCKET="${MINIO_BUCKET:-citewalk-images}"
MINIO_ROOT_USER="${MINIO_ROOT_USER:-minioadmin}"
MINIO_ROOT_PASSWORD="${MINIO_ROOT_PASSWORD:-minioadmin}"
BACKUP_BASE="${BACKUP_BASE:-./volumes/backups}"
MEILISEARCH_URL="${MEILISEARCH_URL:-http://127.0.0.1:7700}"

DATE=$(date +%Y%m%d_%H%M%S)
FULL_DIR="${BACKUP_BASE}/full_${DATE}"
mkdir -p "$FULL_DIR"

echo "[$(date)] Starting full data dump to ${FULL_DIR}"

# -----------------------------------------------------------------------------
# 1. PostgreSQL
# -----------------------------------------------------------------------------
PG_FILE="${FULL_DIR}/postgres_${POSTGRES_DB}.sql.gz"
echo "[1/7] Dumping PostgreSQL (${POSTGRES_DB})..."
if [ -z "$POSTGRES_PASSWORD" ]; then
  echo "    Set POSTGRES_PASSWORD in infra/docker/.env to dump PostgreSQL."
else
  docker compose exec -T db env PGPASSWORD="${POSTGRES_PASSWORD}" pg_dump -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" "$POSTGRES_DB" | gzip > "$PG_FILE"
  echo "    Done: ${PG_FILE}"
fi

# -----------------------------------------------------------------------------
# 2. Neo4j (Cypher export; file written to /backups mount = FULL_DIR)
# -----------------------------------------------------------------------------
NEO4J_FILE="${FULL_DIR}/neo4j.cypher"
echo "[2/7] Dumping Neo4j (Cypher export)..."
CONTAINER_BACKUP_PATH="/backups/full_${DATE}"
docker compose exec -T neo4j cypher-shell -u neo4j -p "$NEO4J_PASSWORD" --format plain \
  "CALL apoc.export.cypher.all('${CONTAINER_BACKUP_PATH}/neo4j.cypher', { format: 'cypherShell', useOptimizations: { type: 'UNWIND_BATCH', unwindBatchSize: 20 } }) YIELD file, batches RETURN file" \
  >/dev/null 2>&1 || true
[ ! -s "$NEO4J_FILE" ] && echo "// Neo4j export (empty or APOC not available)" > "$NEO4J_FILE"
echo "    Done: ${NEO4J_FILE}"

# -----------------------------------------------------------------------------
# 3. Meilisearch (trigger dump, wait, copy dump file from container)
# -----------------------------------------------------------------------------
echo "[3/7] Dumping Meilisearch..."
MEILI_DUMP_DIR="${FULL_DIR}/meilisearch"
mkdir -p "$MEILI_DUMP_DIR"
TASK_RESP=$(curl -s -X POST "${MEILISEARCH_URL}/dumps" -H "Authorization: Bearer ${MEILI_MASTER_KEY}" -H "Content-Type: application/json" 2>/dev/null || echo "")
TASK_UID=$(echo "$TASK_RESP" | grep -o '"taskUid":[0-9]*' | grep -o '[0-9]*')
if [ -n "$TASK_UID" ]; then
  for i in $(seq 1 60); do
    STATUS=$(curl -s "${MEILISEARCH_URL}/tasks/${TASK_UID}" -H "Authorization: Bearer ${MEILI_MASTER_KEY}" 2>/dev/null | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
    if [ "$STATUS" = "succeeded" ]; then
      DUMP_UID=$(curl -s "${MEILISEARCH_URL}/tasks/${TASK_UID}" -H "Authorization: Bearer ${MEILI_MASTER_KEY}" 2>/dev/null | grep -o '"dumpUid":"[^"]*"' | cut -d'"' -f4)
      if [ -n "$DUMP_UID" ]; then
        docker compose cp "meilisearch:/meili_data/dumps/${DUMP_UID}.dump" "$MEILI_DUMP_DIR/meilisearch.dump" 2>/dev/null || true
      fi
      break
    fi
    [ "$i" -eq 60 ] && echo "    Meilisearch dump timed out."
    sleep 2
  done
fi
# Fallback: if no dump file, archive the Meilisearch data volume
if [ ! -f "${MEILI_DUMP_DIR}/meilisearch.dump" ]; then
  tar -czf "${MEILI_DUMP_DIR}/meili_data.tar.gz" -C volumes meilisearch 2>/dev/null || true
fi
echo "    Done: ${MEILI_DUMP_DIR}"

# -----------------------------------------------------------------------------
# 4. MinIO (mirror bucket)
# -----------------------------------------------------------------------------
MINIO_DIR="${FULL_DIR}/minio_${MINIO_BUCKET}"
mkdir -p "$MINIO_DIR"
echo "[4/7] Dumping MinIO bucket (${MINIO_BUCKET})..."
# MC_HOST_<alias>=http://ACCESSKEY:SECRETKEY@host:port — no shell needed (mc is entrypoint)
docker run --rm --network citewalk-network \
  -v "$(pwd)/volumes/backups:/backups:rw" \
  -e "MC_HOST_minio=http://${MINIO_ROOT_USER}:${MINIO_ROOT_PASSWORD}@minio:9000" \
  minio/mc:latest \
  mirror "minio/${MINIO_BUCKET}" "/backups/full_${DATE}/minio_${MINIO_BUCKET}" --quiet 2>/dev/null || true
echo "    Done: ${MINIO_DIR}"

# -----------------------------------------------------------------------------
# 5. Redis (RDB snapshot)
# -----------------------------------------------------------------------------
echo "[5/7] Dumping Redis..."
docker compose exec -T redis redis-cli BGSAVE 2>/dev/null || true
sleep 2
docker compose cp "redis:/data/dump.rdb" "${FULL_DIR}/redis_dump.rdb" 2>/dev/null || true
echo "    Done: ${FULL_DIR}/redis_dump.rdb"

# -----------------------------------------------------------------------------
# 6. Raw volume files (db, neo4j, redis, meilisearch, minio)
# -----------------------------------------------------------------------------
echo "[6/7] Archiving raw volume directories..."
VOLUMES_ARCHIVE="${FULL_DIR}/volumes_all.tar.gz"
if [ -d volumes/db ] || [ -d volumes/neo4j ] || [ -d volumes/redis ] || [ -d volumes/meilisearch ] || [ -d volumes/minio ]; then
  tar -czf "$VOLUMES_ARCHIVE" -C volumes db neo4j redis meilisearch minio 2>/dev/null || true
  echo "    Done: ${VOLUMES_ARCHIVE}"
else
  echo "    Skipped (volumes dir not found)."
fi

# -----------------------------------------------------------------------------
# 7. Manifest
# -----------------------------------------------------------------------------
echo "[7/7] Writing manifest..."
cat > "${FULL_DIR}/manifest.txt" << MANIFEST
Citewalk full data dump
date=${DATE}
postgres=${POSTGRES_DB}
neo4j=neo4j
meilisearch=meili_data
minio_bucket=${MINIO_BUCKET}
redis=redis_dump.rdb
volumes=volumes_all.tar.gz
MANIFEST

echo "[$(date)] Full data dump finished: ${FULL_DIR}"
echo "Restore with: ./infra/docker/restore-full.sh $(pwd)/volumes/backups/full_${DATE}"
