#!/bin/sh
# Full backup: PostgreSQL, Neo4j (Cypher export), MinIO bucket.
# Run inside backup-full container; /backups is mounted.
# Retention: keep last FULL_BACKUP_KEEP_DAYS (default 7).

set -e

POSTGRES_HOST=${POSTGRES_HOST:-db}
POSTGRES_PORT=${POSTGRES_PORT:-5432}
POSTGRES_USER=${POSTGRES_USER:-postgres}
POSTGRES_DB=${POSTGRES_DB:-postgres}
BACKUP_DIR=${BACKUP_DIR:-/backups}
KEEP_DAYS=${FULL_BACKUP_KEEP_DAYS:-7}
MINIO_ALIAS=${MINIO_ALIAS:-minio}
MINIO_BUCKET=${MINIO_BUCKET:-citewalk-images}
NEO4J_URI=${NEO4J_URI:-bolt://neo4j:7687}

DATE=$(date +%Y%m%d_%H%M%S)
FULL_DIR="${BACKUP_DIR}/full_${DATE}"
mkdir -p "$FULL_DIR"

echo "[$(date)] Starting full backup to ${FULL_DIR}"

# -----------------------------------------------------------------------------
# 1. PostgreSQL
# -----------------------------------------------------------------------------
PG_FILE="${FULL_DIR}/postgres_${POSTGRES_DB}.sql.gz"
echo "[$(date)] Backing up PostgreSQL (${POSTGRES_DB})..."
PGPASSWORD="${POSTGRES_PASSWORD}" pg_dump -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" "$POSTGRES_DB" | gzip > "$PG_FILE"
echo "[$(date)] PostgreSQL backup done: ${PG_FILE}"

# -----------------------------------------------------------------------------
# 2. Neo4j (Cypher export; file written by Neo4j server to shared /backups)
# -----------------------------------------------------------------------------
NEO4J_FILE="${FULL_DIR}/neo4j.cypher"
echo "[$(date)] Backing up Neo4j (Cypher export)..."
cypher-shell -a "$NEO4J_URI" -u neo4j -p "$NEO4J_PASSWORD" --format plain \
  "CALL apoc.export.cypher.all('${NEO4J_FILE}', { format: 'cypherShell', useOptimizations: { type: 'UNWIND_BATCH', unwindBatchSize: 20 } }) YIELD file, batches RETURN file" \
  >/dev/null 2>&1 || true
if [ ! -s "$NEO4J_FILE" ]; then
  echo "// Neo4j export (empty or APOC not available)" > "$NEO4J_FILE"
fi
echo "[$(date)] Neo4j backup done: ${NEO4J_FILE}"

# -----------------------------------------------------------------------------
# 3. MinIO (mirror bucket to backup dir)
# -----------------------------------------------------------------------------
MINIO_DIR="${FULL_DIR}/minio_${MINIO_BUCKET}"
mkdir -p "$MINIO_DIR"
echo "[$(date)] Backing up MinIO bucket (${MINIO_BUCKET})..."
# Ensure mc alias exists (idempotent)
mc alias set "$MINIO_ALIAS" "http://${MINIO_HOST:-minio}:${MINIO_PORT:-9000}" "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD" 2>/dev/null || true
mc mirror "${MINIO_ALIAS}/${MINIO_BUCKET}" "$MINIO_DIR" --quiet 2>/dev/null || true
echo "[$(date)] MinIO backup done: ${MINIO_DIR}"

# -----------------------------------------------------------------------------
# 4. Manifest (backup metadata)
# -----------------------------------------------------------------------------
cat > "${FULL_DIR}/manifest.txt" << MANIFEST
Citewalk-full-backup
date=${DATE}
postgres=${POSTGRES_DB}
neo4j=neo4j
minio_bucket=${MINIO_BUCKET}
MANIFEST
echo "[$(date)] Full backup completed: ${FULL_DIR}"

# -----------------------------------------------------------------------------
# 5. Retention: remove full backups older than KEEP_DAYS
# -----------------------------------------------------------------------------
echo "[$(date)] Removing full backups older than ${KEEP_DAYS} days..."
find "$BACKUP_DIR" -maxdepth 1 -type d -name "full_*" -mtime +${KEEP_DAYS} -exec rm -rf {} \; 2>/dev/null || true
# Also remove old postgres-only files if present (legacy)
find "$BACKUP_DIR" -maxdepth 1 -type f -name "backup_*.sql.gz" -mtime +${KEEP_DAYS} -delete 2>/dev/null || true

echo "[$(date)] Full backup and cleanup finished."
