#!/bin/bash

# Script to run migration for table-service
# This converts table_number from integer to varchar

echo "🔄 Running migration: Convert table_number from integer to varchar"

# Check if running in Docker or locally
if [ -f /.dockerenv ]; then
    # Running inside Docker
    DB_HOST="postgres-auth"
    DB_PORT="5432"
else
    # Running locally
    DB_HOST="${DB_HOST:-localhost}"
    DB_PORT="${DB_PORT:-5433}"
fi

DB_USER="${DB_USER:-postgres}"
DB_PASS="${DB_PASS:-Bapbap1412}"
DB_NAME="${TABLE_DB_NAME:-table_db}"

echo "📊 Database connection:"
echo "   Host: $DB_HOST"
echo "   Port: $DB_PORT"
echo "   Database: $DB_NAME"
echo "   User: $DB_USER"
echo ""

# Run migration
PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f /app/docker/migrate-table-number-to-string.sql

if [ $? -eq 0 ]; then
    echo "✅ Migration completed successfully!"
else
    echo "❌ Migration failed!"
    exit 1
fi








