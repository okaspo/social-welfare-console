import { Client } from 'pg';

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

        // 1. Dump admin_roles
        const roles = await client.query('SELECT * FROM admin_roles');
        console.log('--- admin_roles ---');
        console.table(roles.rows);

        // 2. Check user
        const targetEmail = 'qubo.jun@gmail.com';
        const userRes = await client.query('SELECT id, email, created_at FROM auth.users WHERE email = $1', [targetEmail]);
        console.log('--- auth.users (target) ---');
        console.table(userRes.rows);

        if (roles.rows.length > 0 && userRes.rows.length > 0) {
            const roleUserId = roles.rows[0].user_id;
            const authUserId = userRes.rows[0].id;
            console.log(`Match? ${roleUserId === authUserId} (Role: ${roleUserId}, Auth: ${authUserId})`);
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

main();
