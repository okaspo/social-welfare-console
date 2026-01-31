import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

async function main() {
    console.log('Starting permission fix...')

    const connectionString = process.env.DATABASE_URL
    if (!connectionString) {
        throw new Error('DATABASE_URL is missing')
    }

    // Use the same adapter setup as the main app
    const pool = new Pool({ connectionString })
    const adapter = new PrismaPg(pool)
    const prisma = new PrismaClient({ adapter })

    const queries = [
        // 1. Grant USAGE on SCHEMA public
        `GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;`,

        // 2. Grant FULL access to postgres and service_role (Admin)
        `GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;`,
        `GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;`,
        `GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, service_role;`,

        // 3. Grant RW access to authenticated users (RLS will restrict rows)
        `GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;`,
        `GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;`,

        // 4. Grant Read-Only access to anon (Optional, but usually needed for public pages)
        `GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;`,
        `GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;`
    ]

    try {
        for (const query of queries) {
            try {
                console.log(`Executing: ${query}`)
                await prisma.$executeRawUnsafe(query)
                console.log('Success.')
            } catch (e) {
                console.error(`Failed to execute query: ${query}`)
                console.error(e)
            }
        }
        console.log('All permission fixes attempted.')
    } finally {
        await prisma.$disconnect()
        await pool.end()
    }
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
