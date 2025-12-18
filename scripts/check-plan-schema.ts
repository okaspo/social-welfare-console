
import { Client } from 'pg';

const dbUrl = 'postgresql://postgres:-%26A4xbg8Q%21%23G%2BSr@db.baayjlwyxjplwuteiyne.supabase.co:5432/postgres';

async function main() {
    const client = new Client({ connectionString: dbUrl });
    await client.connect();

    try {
        console.log('--- admin_roles columns ---');
        const rolesRes = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'admin_roles';
        `);
        console.table(rolesRes.rows);

        console.log('--- plan_limits columns ---');
        const limitsRes = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'plan_limits';
        `);
        console.table(limitsRes.rows);

        console.log('--- plan_prices columns ---');
        const pricesRes = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'plan_prices';
        `);
        console.table(pricesRes.rows);

        console.log('--- RLS Policies on plan_prices ---');
        const policiesRes = await client.query(`
            select * from pg_policies where tablename = 'plan_prices';
        `);
        console.table(policiesRes.rows);

    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}

main();
