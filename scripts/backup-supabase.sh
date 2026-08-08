#!/bin/bash
# Backup Supabase database
# Requires: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY env vars
# Usage: ./scripts/backup-supabase.sh
#
# Setup:
# 1. Go to Supabase Dashboard > Settings > Database > Connection string > URI
# 2. Copy the connection string (the "URI" tab, not the direct connection one)
# 3. Set it as DATABASE_URL in your GitHub Secrets (Settings > Secrets and variables > Actions)
# 4. The secret name should be SUPABASE_DATABASE_URL
# 5. This workflow will also need the postgresql-client installed (handled in the workflow)

set -euo pipefail

BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_${TIMESTAMP}.sql"

mkdir -p "$BACKUP_DIR"

echo "Starting Supabase backup..."

# Using pg_dump via Supabase's database connection string
# You can find the connection string in Supabase Dashboard > Settings > Database
if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL environment variable is not set."
  echo "Find it in Supabase Dashboard > Settings > Database > Connection string > URI"
  exit 1
fi

pg_dump "$DATABASE_URL" > "$BACKUP_FILE"

echo "Backup saved to: $BACKUP_FILE"
echo "Size: $(du -h "$BACKUP_FILE" | cut -f1)"

# Keep only last 7 backups
ls -t "$BACKUP_DIR"/backup_*.sql 2>/dev/null | tail -n +8 | xargs -r rm
echo "Old backups cleaned up (keeping last 7)."
