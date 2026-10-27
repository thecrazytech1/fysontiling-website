#!/usr/bin/env bash
# Nightly encrypted backup to a private git repo: the site's tables (enquiries, testimonials) plus the
# server secrets and config that aren't in the code repo. Everything is encrypted to an age public key
# before touching disk; the private key lives off this server.
#
# Needs in .env: DATABASE_URL, BACKUP_REPO_DIR (a clone of the private backup repo),
# BACKUP_AGE_RECIPIENT (the age1... public key).
#
# Restore (on a machine holding the private key):
#   age -d -i fysontiling-backup.key backups/YYYY-MM-DD.sql.gz.age | gunzip | psql "$DATABASE_URL"
# into a database where the public tables don't exist yet. Server config:
#   age -d -i fysontiling-backup.key config/server-config.tar.gz.age | tar -xzv
set -euo pipefail

# Secrets and server config needed to rebuild the server (not in the code repo).
config_files=(
  /home/debian/fysontiling-website/.env
  /home/debian/supabase/supabase-project/.env
  /etc/caddy/Caddyfile
)

site_dir="$(cd "$(dirname "$0")/.." && pwd)"
set -a
# shellcheck source=/dev/null
. "$site_dir/.env"
set +a
: "${DATABASE_URL:?missing from .env}" "${BACKUP_REPO_DIR:?missing from .env}" "${BACKUP_AGE_RECIPIENT:?missing from .env}"

stamp="$(date -u +%Y-%m-%d)"
mkdir -p "$BACKUP_REPO_DIR/backups" "$BACKUP_REPO_DIR/config"
tmp="$(mktemp "$BACKUP_REPO_DIR/backups/.partial.XXXXXX")"
config_tmp="$(mktemp "$BACKUP_REPO_DIR/config/.partial.XXXXXX")"
trap 'rm -f "$tmp" "$config_tmp"' EXIT

# pipefail makes a pg_dump failure abort here, so a broken dump is never committed.
pg_dump "$DATABASE_URL" --schema=public --no-owner | gzip -9 | age -r "$BACKUP_AGE_RECIPIENT" >"$tmp"
mv "$tmp" "$BACKUP_REPO_DIR/backups/$stamp.sql.gz.age"

# Overwritten nightly; git history keeps earlier versions.
tar -czf - -C / "${config_files[@]#/}" | age -r "$BACKUP_AGE_RECIPIENT" >"$config_tmp"
mv "$config_tmp" "$BACKUP_REPO_DIR/config/server-config.tar.gz.age"

cd "$BACKUP_REPO_DIR"
git add backups config
git commit --quiet -m "Backup $stamp"
git push --quiet
echo "Backup $stamp pushed"
