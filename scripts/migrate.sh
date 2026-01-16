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

# Push migrations to the database
echo "📤 Pushing migrations to database..."
npx supabase db push

echo "✅ Migration completed successfully!"
