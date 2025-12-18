import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
    // Hardcoded from apply-now.ts
    const dbUrl = 'postgresql://postgres:-%26A4xbg8Q%21%23G%2BSr@db.baayjlwyxjplwuteiyne.supabase.co:5432/postgres';

    const client = new Client({
        connectionString: dbUrl,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('Connected to DB.');

        // 1. Check if admin_roles exists
        try {
            await client.query('SELECT count(*) FROM admin_roles');
            console.log('Table admin_roles exists.');
        } catch (e: any) {
            console.log('Table admin_roles missing or error:', e.message);
            if (e.message.includes('does not exist')) {
                // 2. Apply Migration
                console.log('Applying migration 20251218_admin_roles.sql...');
                const migrationPath = path.join(process.cwd(), 'supabase/migrations/20251218_admin_roles.sql');
                if (fs.existsSync(migrationPath)) {
                    const sql = fs.readFileSync(migrationPath, 'utf8');
                    await client.query(sql);
                    console.log('Migration applied successfully!');
                } else {
                    console.error('Migration file not found:', migrationPath);
                }
            }
        }

    } catch (err) {
        console.error('Database connection error:', err);
    } finally {
        await client.end();
    }
}

main();
