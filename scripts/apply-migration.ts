import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
        console.error('Error: DATABASE_URL environment variable is not set.');
        process.exit(1);
    }

    const migrationFile = path.join(process.cwd(), 'supabase/migrations/20251217_phase3_comprehensive_schema.sql');

    if (!fs.existsSync(migrationFile)) {
        console.error(`Error: Migration file not found at ${migrationFile}`);
        process.exit(1);
    }

    const sql = fs.readFileSync(migrationFile, 'utf8');

    console.log('Connecting to database...');
    const client = new Client({
        connectionString: dbUrl,
        ssl: { rejectUnauthorized: false } // Required for Supabase/Neon/etc
    });

    try {
        await client.connect();
        console.log('Applying migration...');
        await client.query(sql);
        console.log('Migration applied successfully!');
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    } finally {
        await client.end();
    }
}

main();
