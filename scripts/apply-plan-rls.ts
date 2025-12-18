
import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

const dbUrl = 'postgresql://postgres:-%26A4xbg8Q%21%23G%2BSr@db.baayjlwyxjplwuteiyne.supabase.co:5432/postgres';

async function main() {
    const client = new Client({ connectionString: dbUrl });
    await client.connect();

    try {
        // Fix path resolution (hardcoded or relative to process.cwd)
        const migrationPath = 'c:/Users/qubo_/.gemini/antigravity/scratch/social-welfare-console/supabase/migrations/20251218_fix_plan_rls.sql';
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
