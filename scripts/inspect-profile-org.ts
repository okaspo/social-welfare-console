
const { Client } = require('pg');

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:-%26A4xbg8Q%21%23G%2BSr@db.baayjlwyxjplwuteiyne.supabase.co:5432/postgres";

async function main() {
    const client = new Client({ connectionString });

    try {
        await client.connect();

        console.log("--- CHECKING PROFILE ORG ---");
        const res = await client.query(`
            SELECT id, full_name, organization_id 
            FROM public.profiles 
            WHERE id = '6408221b-c682-4161-90a8-046645550302'
        `);
        console.table(res.rows);

    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

main();
