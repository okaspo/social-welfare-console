import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
    // Hardcoded DB URL
    const dbUrl = 'postgresql://postgres:-%26A4xbg8Q%21%23G%2BSr@db.baayjlwyxjplwuteiyne.supabase.co:5432/postgres';

    const client = new Client({
        connectionString: dbUrl,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('Connected to DB.');

        const migrationPath = path.join(process.cwd(), 'supabase/migrations/20251218_fix_recursion_final.sql');
        if (fs.existsSync(migrationPath)) {
            console.log('Applying Final RLS fix...');
            const sql = fs.readFileSync(migrationPath, 'utf8');
            await client.query(sql);
            console.log('Fix applied successfully!');
        } else {
            console.error('Migration file not found:', migrationPath);
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

main();
