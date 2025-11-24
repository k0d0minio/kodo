#!/bin/bash

# Script to run Supabase migrations
# This script combines all migration files and runs them in order

set -e

MIGRATIONS_DIR="supabase/migrations"
TEMP_SQL_FILE="/tmp/all_migrations.sql"

# Check if Supabase environment variables are set
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "Error: Missing Supabase environment variables"
    echo "Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
    exit 1
fi

# Extract database URL from Supabase URL
# Supabase URL format: https://xxxxx.supabase.co
# We need to construct the connection string
SUPABASE_PROJECT_REF=$(echo $NEXT_PUBLIC_SUPABASE_URL | sed 's|https://||' | sed 's|\.supabase\.co||')

echo "Project reference: $SUPABASE_PROJECT_REF"
echo ""
echo "To run migrations, you have two options:"
echo ""
echo "Option 1: Use Supabase CLI (Recommended)"
echo "  1. Link your project: supabase link --project-ref $SUPABASE_PROJECT_REF"
echo "  2. Push migrations: supabase db push"
echo ""
echo "Option 2: Run via Supabase Dashboard"
echo "  1. Go to: https://supabase.com/dashboard/project/$SUPABASE_PROJECT_REF/sql"
echo "  2. Copy and paste each migration file in order:"
echo ""

# List all migration files
for file in $(ls -1 $MIGRATIONS_DIR/*.sql | sort); do
    echo "    - $(basename $file)"
done

echo ""
echo "Option 3: Use psql (if you have the connection string)"
echo "  Combine all migrations:"
echo "    cat $MIGRATIONS_DIR/*.sql | psql 'your-connection-string'"
echo ""

