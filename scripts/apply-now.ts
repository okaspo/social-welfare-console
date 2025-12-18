import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
    // URL Encode the password: -&A4xbg8Q!#G+Sr -> -%26A4xbg8Q%21%23G%2BSr
    // # MUST be encoded or it truncates the URL.
    const dbUrl = 'postgresql://postgres:-%26A4xbg8Q%21%23G%2BSr@db.baayjlwyxjplwuteiyne.supabase.co:5432/postgres';

    // Log masked URL for debugging confirmation
    console.log('Using DB URL:', dbUrl.replace(/:([^:@]+)@/, ':****@'));

    const migrationFile = path.join(process.cwd(), 'supabase/migrations/20251217_add_subscription_columns.sql');

    if (!fs.existsSync(migrationFile)) {
        console.error(`Error: Migration file not found at ${migrationFile}`);
        process.exit(1);
    }

    const sql = fs.readFileSync(migrationFile, 'utf8');

    console.log('Connecting to database...');
    const client = new Client({
        connectionString: dbUrl,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('Applying migration...');
        await client.query(sql);
        console.log('Migration applied successfully!');
    } catch (err) {
        fs.writeFileSync('error.json', JSON.stringify(err, null, 2));
        console.error('Migration failed. Details written to error.json');
        process.exit(1);
    } finally {
        await client.end();
    }
}

main();
