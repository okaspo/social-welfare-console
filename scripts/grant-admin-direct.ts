
import { Client } from 'pg';

const dbUrl = 'postgresql://postgres:-%26A4xbg8Q%21%23G%2BSr@db.baayjlwyxjplwuteiyne.supabase.co:5432/postgres';

async function main() {
    const client = new Client({ connectionString: dbUrl });
    await client.connect();

    try {
        console.log('Executing UPSERT for super_admin...');
        await client.query(`
            INSERT INTO public.admin_roles (user_id, role)
            SELECT id, 'super_admin'
            FROM auth.users
            WHERE email = 'junichiro.kubo@ainomi.com'
            ON CONFLICT (user_id) 
            DO UPDATE SET role = 'super_admin';
        `);

        console.log('Verifying result...');
        const res = await client.query(`
            SELECT ar.role, au.email 
            FROM public.admin_roles ar
            JOIN auth.users au ON ar.user_id = au.id
            WHERE au.email = 'junichiro.kubo@ainomi.com';
        `);

        console.table(res.rows);

    } catch (e) {
        console.error('Error executing SQL:', e);
    } finally {
        await client.end();
    }
}

main();
