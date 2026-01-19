#!/bin/bash

# Prisma Migration Script for Vercel Deployment
# This script runs Prisma migrations before the Next.js build

set -e

echo "🚀 Starting Prisma migration..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "⚠️  DATABASE_URL is not set. Skipping migration."
    exit 0
fi

# Generate Prisma Client
echo "📦 Generating Prisma Client..."
npx prisma generate

# Deploy migrations (production-safe, only applies pending migrations)
echo "📤 Deploying database migrations..."
npx prisma migrate deploy || {
    echo "⚠️  Migration had issues. Attempting db push as fallback..."
    npx prisma db push --accept-data-loss=false || {
        echo "❌  All migration attempts failed, but continuing with build..."
        exit 0
    }
}

echo "✅ Prisma migration completed successfully!"
