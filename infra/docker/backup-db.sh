#!/bin/sh

# Set defaults
POSTGRES_HOST=${POSTGRES_HOST:-db}
POSTGRES_PORT=${POSTGRES_PORT:-5432}
POSTGRES_USER=${POSTGRES_USER:-postgres}
POSTGRES_DB=${POSTGRES_DB:-postgres}
BACKUP_DIR=${BACKUP_DIR:-/backups}
KEEP_DAYS=${KEEP_DAYS:-7}

# Date format for filename
DATE=$(date +%Y%m%d_%H%M%S)
FILENAME="${BACKUP_DIR}/backup_${POSTGRES_DB}_${DATE}.sql.gz"

echo "[$(date)] Starting backup of ${POSTGRES_DB}..."

# Create backup
PGPASSWORD="${POSTGRES_PASSWORD}" pg_dump -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" "$POSTGRES_DB" | gzip > "$FILENAME"

if [ $? -eq 0 ]; then
  echo "[$(date)] Backup created successfully: $FILENAME"
  
  # Cleanup old backups
  echo "[$(date)] Cleaning up backups older than ${KEEP_DAYS} days..."
  find "$BACKUP_DIR" -type f -name "*.sql.gz" -mtime +${KEEP_DAYS} -exec rm {} \;
else
  echo "[$(date)] Backup failed!"
  exit 1
fi
