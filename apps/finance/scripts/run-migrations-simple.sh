#!/bin/bash

# Simple script to run migrations using Supabase CLI

set -e

echo "🚀 Running Supabase Migrations"
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed"
    echo "   Install it from: https://supabase.com/docs/guides/cli"
    exit 1
fi

# Check if migrations directory exists
if [ ! -d "supabase/migrations" ]; then
    echo "❌ Migrations directory not found"
    exit 1
fi

# Count migration files
MIGRATION_COUNT=$(ls -1 supabase/migrations/*.sql 2>/dev/null | wc -l)
echo "📦 Found $MIGRATION_COUNT migration files"
echo ""

# Try to push migrations
echo "Attempting to push migrations..."
echo ""

# First, try to check if project is linked
if supabase status &> /dev/null; then
    echo "✅ Project is linked, pushing migrations..."
    supabase db push
else
    echo "⚠️  Project is not linked"
    echo ""
    echo "To link your project, run:"
    echo "   supabase link --project-ref YOUR_PROJECT_REF"
    echo ""
    echo "Or run migrations manually:"
    echo "   1. Go to your Supabase Dashboard"
    echo "   2. Navigate to SQL Editor"
    echo "   3. Copy and paste the contents of each file in supabase/migrations/"
    echo "   4. Run them in order (sorted by filename)"
    echo ""
    echo "Migration files to run:"
    ls -1 supabase/migrations/*.sql | sort
    echo ""
    echo "Or use the combined file at: /tmp/combined_migrations.sql"
fi

