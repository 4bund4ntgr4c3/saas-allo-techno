#!/bin/bash
# Backup Supabase database (via Supabase CLI + API, pas besoin de DATABASE_URL)
# Requires: SUPABASE_ACCESS_TOKEN env var (Personal Access Token)
# Usage: ./scripts/backup-supabase.sh

set -euo pipefail

BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_${TIMESTAMP}.sql"

mkdir -p "$BACKUP_DIR"

echo "Starting Supabase backup..."

if [ -z "${SUPABASE_ACCESS_TOKEN:-}" ]; then
  echo "ERROR: SUPABASE_ACCESS_TOKEN environment variable is not set."
  exit 1
fi

# Schema + roles
npx --yes supabase db dump --linked -f "$BACKUP_FILE.schema.sql"
# Data only
npx --yes supabase db dump --linked --data-only -f "$BACKUP_FILE.data.sql"

# Concatenate into one file
cat "$BACKUP_FILE.schema.sql" "$BACKUP_FILE.data.sql" > "$BACKUP_FILE"
rm -f "$BACKUP_FILE.schema.sql" "$BACKUP_FILE.data.sql"

echo "Backup saved to: $BACKUP_FILE"
echo "Size: $(du -h "$BACKUP_FILE" | cut -f1)"

# Keep only last 7 backups
ls -t "$BACKUP_DIR"/backup_*.sql 2>/dev/null | tail -n +8 | xargs -r rm
echo "Old backups cleaned up (keeping last 7)."