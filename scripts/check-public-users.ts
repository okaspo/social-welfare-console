
const { Client } = require('pg');

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:-%26A4xbg8Q%21%23G%2BSr@db.baayjlwyxjplwuteiyne.supabase.co:5432/postgres";

async function main() {
    const client = new Client({ connectionString });

    try {
        await client.connect();

        console.log("--- CHECKING PUBLIC USERS ---");
        const res = await client.query('SELECT * FROM public.users');
        console.log(`Count: ${res.rows.length}`);
        console.table(res.rows);

    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

main();
