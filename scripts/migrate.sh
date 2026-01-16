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

# Install Supabase CLI
echo "📦 Installing Supabase CLI..."
npm install -g supabase@latest

# Link to the Supabase project
echo "🔗 Linking to Supabase project..."
supabase link --project-ref "$SUPABASE_PROJECT_REF"

# Push migrations to the database
echo "📤 Pushing migrations to database..."
supabase db push

echo "✅ Migration completed successfully!"
