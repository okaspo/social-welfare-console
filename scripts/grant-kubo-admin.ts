
import { createClient } from '@supabase/supabase-js';
import { Client } from 'pg';

const dbUrl = 'postgresql://postgres:-%26A4xbg8Q%21%23G%2BSr@db.baayjlwyxjplwuteiyne.supabase.co:5432/postgres';

async function main() {
    console.log('Connecting to database...');
    const client = new Client({
        connectionString: dbUrl,
    });

    try {
        await client.connect();

        // Target emails (including the likely typo and the correct one)
        const emails = ['junichiro.kubo@ainomi.com', 'junichiro.kubo@ainoi.com']; // Handing both just in case

        for (const email of emails) {
            console.log(`Checking user: ${email}`);
            const userRes = await client.query('SELECT id, email FROM auth.users WHERE email = $1', [email]);

            if (userRes.rows.length === 0) {
                console.log(`User not found: ${email}`);
                continue;
            }

            const user = userRes.rows[0];
            console.log(`Found user: ${user.email} (${user.id})`);

            console.log(`Granting super_admin to ${user.email}...`);
            await client.query(`
                INSERT INTO public.admin_roles (user_id, role)
                VALUES ($1, 'super_admin')
                ON CONFLICT (user_id)
                DO UPDATE SET role = 'super_admin', updated_at = now();
            `, [user.id]);

            console.log('Success!');
        }

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await client.end();
    }
}

main();
