
import { Client } from 'pg';
import * as fs from 'fs';

const dbUrl = 'postgresql://postgres:-%26A4xbg8Q%21%23G%2BSr@db.baayjlwyxjplwuteiyne.supabase.co:5432/postgres';

async function main() {
    const client = new Client({ connectionString: dbUrl });
    await client.connect();

    try {
        const migrationPath = 'c:/Users/qubo_/.gemini/antigravity/scratch/social-welfare-console/supabase/migrations/20251218_plan_quotas.sql';
        const sql = fs.readFileSync(migrationPath, 'utf8');

        console.log('Applying migration...');
        await client.query(sql);
        console.log('Migration applied successfully.');

    } catch (e) {
        console.error('Migration failed:', e);
    } finally {
        await client.end();
    }
}

main();
