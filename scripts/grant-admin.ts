import { Client } from 'pg';

async function main() {
    // Hardcoded DB URL from previous steps
    const dbUrl = 'postgresql://postgres:-%26A4xbg8Q%21%23G%2BSr@db.baayjlwyxjplwuteiyne.supabase.co:5432/postgres';

    const client = new Client({
        connectionString: dbUrl,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('Connected to DB.');

        // 1. Find User ID by Email
        const targetEmail = 'qubo.jun@gmail.com';
        console.log(`Searching for user: ${targetEmail}...`);

        const userRes = await client.query('SELECT id, email FROM auth.users WHERE email = $1', [targetEmail]);

        if (userRes.rows.length === 0) {
            console.error('User not found!');
            // List some users to help debugging
            const allUsers = await client.query('SELECT email FROM auth.users LIMIT 5');
            console.log('Available users:', allUsers.rows.map(r => r.email));
            return;
        }

        const userId = userRes.rows[0].id;
        console.log(`Found User ID: ${userId}`);

        // 2. Insert Admin Role
        console.log('Granting super_admin role...');
        const insertRes = await client.query(`
            INSERT INTO public.admin_roles (user_id, role)
            VALUES ($1, 'super_admin')
            ON CONFLICT (user_id) 
            DO UPDATE SET role = 'super_admin';
        `, [userId]);

        console.log('Success! Admin privileges granted.');

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

main();
