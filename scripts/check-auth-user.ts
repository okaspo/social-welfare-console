
const { Client } = require('pg');

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:-%26A4xbg8Q%21%23G%2BSr@db.baayjlwyxjplwuteiyne.supabase.co:5432/postgres";

async function main() {
    const client = new Client({ connectionString });

    try {
        await client.connect();

        console.log("--- CHECKING AUTH USERS ---");
        // Check for the user with email likely used (based on previous logs/context or just list all)
        // Since I don't know the exact email, I'll list top 5
        const users = await client.query('SELECT id, email, created_at FROM auth.users');
        console.table(users.rows);

        console.log("--- CHECKING PROFILES ---");
        const profiles = await client.query('SELECT id, full_name FROM public.profiles');
        console.table(profiles.rows);

    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

main();
