#!/bin/bash

# Supabase Migration Script for Vercel Deployment
# This script runs database migrations before the Next.js build

set -e

echo "🚀 Starting Supabase migration..."

# Check if required environment variables are set
if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
    echo "⚠️  SUPABASE_ACCESS_TOKEN is not set. Skipping migration."
    exit 0
fi

if [ -z "$SUPABASE_PROJECT_REF" ]; then
    echo "⚠️  SUPABASE_PROJECT_REF is not set. Skipping migration."
    exit 0
fi

# Use npx to run Supabase CLI (no global install needed)
echo "🔗 Linking to Supabase project..."
npx supabase link --project-ref "$SUPABASE_PROJECT_REF"

# First, repair migration history to mark existing migrations as applied
echo "🔧 Syncing migration history..."
npx supabase migration repair --status applied 20251207_init || true
npx supabase migration repair --status applied 20251209_add_archived_at || true

# Push only new migrations (those not yet in remote history)
echo "📤 Pushing new migrations to database..."
npx supabase db push --include-all || {
    echo "⚠️  Migration push had issues, but continuing with build..."
    exit 0
}

echo "✅ Migration completed successfully!"
