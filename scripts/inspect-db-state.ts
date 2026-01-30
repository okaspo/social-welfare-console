
const { Client } = require('pg');

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:-%26A4xbg8Q%21%23G%2BSr@db.baayjlwyxjplwuteiyne.supabase.co:5432/postgres";

async function main() {
    const client = new Client({ connectionString });

    try {
        await client.connect();

        console.log("--- CHECKING DATA ---");
        const profiles = await client.query('SELECT id, full_name, organization_id FROM public.profiles');
        console.log(`Profiles Count: ${profiles.rows.length}`);
        console.table(profiles.rows);

        const orgs = await client.query('SELECT id, name FROM public.organizations');
        console.log(`Orgs Count: ${orgs.rows.length}`);
        console.table(orgs.rows);

    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

main();
