// RLSマイグレーション実行スクリプト
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 直接接続設定（Poolerではなく直接DB接続）
const connectionConfig = {
    host: 'db.baayjlwyxjplwuteiyne.supabase.co',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: '-&A4xbg8Q!#G+Sr',
    ssl: { rejectUnauthorized: false }
};

async function runMigration() {
    const client = new pg.Client(connectionConfig);

    try {
        console.log('Connecting to Supabase (Direct Connection)...');
        await client.connect();
        console.log('Connected!');

        const migrationPath = path.join(__dirname, '../supabase/migrations/20260124_fix_rls_recursion.sql');
        const sql = fs.readFileSync(migrationPath, 'utf8');

        console.log('Running migration...');
        await client.query(sql);
        console.log('Migration completed successfully!');

    } catch (error) {
        console.error('Migration failed:', error.message);
        process.exit(1);
    } finally {
        await client.end();
    }
}

runMigration();
