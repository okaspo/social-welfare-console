
const { Client } = require('pg');

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:-%26A4xbg8Q%21%23G%2BSr@db.baayjlwyxjplwuteiyne.supabase.co:5432/postgres";

async function main() {
    const client = new Client({ connectionString });

    try {
        await client.connect();

        const authId = '6408221b-c682-4161-90a8-046645550302';
        // Organization ID from '社会福法人あいの実' (d023... used this)
        // From Step 559: '1d42c1e0-2b5b-436e-a323-529440f6e394'
        const orgId = '1d42c1e0-2b5b-436e-a323-529440f6e394';

        console.log(`Inserting Profile for ${authId}...`);

        await client.query(`
            INSERT INTO public.profiles (id, full_name, organization_id, role, created_at, updated_at)
            VALUES ($1, $2, $3, $4, NOW(), NOW())
            ON CONFLICT (id) DO UPDATE 
            SET organization_id = $3, updated_at = NOW();
        `, [
            authId,
            'Real User (Recovered)', // Name
            orgId,
            'general'
        ]);

        console.log("Profile inserted/updated successfully.");

    } catch (err) {
        console.error("Error inserting profile:", err);
    } finally {
        await client.end();
    }
}

main();
