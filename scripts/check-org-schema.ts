
import { Client } from 'pg';

const dbUrl = 'postgresql://postgres:-%26A4xbg8Q%21%23G%2BSr@db.baayjlwyxjplwuteiyne.supabase.co:5432/postgres';

async function main() {
    const client = new Client({ connectionString: dbUrl });
    await client.connect();

    try {
        console.log('--- organizations columns ---');
        const orgsRes = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'organizations';
        `);
        console.table(orgsRes.rows);

        console.log('--- organization_members columns ---');
        const membersRes = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'organization_members';
        `);
        console.table(membersRes.rows);

        console.log('--- RLS Policies on organizations ---');
        const policiesRes = await client.query(`
            select * from pg_policies where tablename = 'organizations';
        `);
        console.table(policiesRes.rows);

    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}

main();
