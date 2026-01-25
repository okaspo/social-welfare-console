#!/bin/bash
set -e

echo "🚀 Starting Prisma Migration..."

# Run Prisma Migrate
npx prisma migrate deploy

echo "✅ Prisma Migration Completed."
