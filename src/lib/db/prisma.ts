/**
 * Prisma Client Singleton with pg adapter
 * https://www.prisma.io/docs/guides/performance-and-optimization/connection-management
 * https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/databases-connections/postgresql#driver-adapters
 */

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
    pool: Pool | undefined;
};

function createPrismaClient(): PrismaClient {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
        throw new Error('DATABASE_URL environment variable is required');
    }

    // Create a connection pool
    const pool = globalForPrisma.pool ?? new Pool({ connectionString });
    if (process.env.NODE_ENV !== 'production') {
        globalForPrisma.pool = pool;
    }

    // Create the adapter
    const adapter = new PrismaPg(pool);

    // Create PrismaClient with the adapter
    return new PrismaClient({
        adapter,
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
