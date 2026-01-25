
const { Client } = require('pg');

const connectionString = "postgresql://postgres:-%26A4xbg8Q%21%23G%2BSr@db.baayjlwyxjplwuteiyne.supabase.co:5432/postgres";

async function main() {
    const client = new Client({
        connectionString: connectionString,
    });

    try {
        await client.connect();
        console.log("Connected to DB");

        // List all tables in public schema
        const resTables = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        const tables = resTables.rows.map((r: any) => r.table_name);
        console.log("Tables in public schema:", tables.join(', '));

        if (!tables.includes('profiles')) {
            console.error("CRITICAL: 'profiles' table is missing!");
        } else {
            console.log(" Profiles table exists.");
        }

        // 1. Check Auth Users
        const resUsers = await client.query('SELECT id, email, raw_user_meta_data FROM auth.users LIMIT 5');
        if (resUsers.rows.length === 0) {
            console.log("No users found in auth.users. You need to Sign Up first.");
            return;
        }

        console.log(`Found ${resUsers.rows.length} users.`);

        for (const user of resUsers.rows) {
            console.log(`Checking user: ${user.email} (${user.id})`);

            // 2. Check Profile
            const resProfile = await client.query('SELECT id FROM public.profiles WHERE id = $1', [user.id]);

            if (resProfile.rows.length === 0) {
                console.log(`- Profile missing for ${user.email}. Restoring...`);

                const orgName = user.raw_user_meta_data?.corporation_name || 'Restored Corp';

                // 3. Create Org
                // Check if Org exists by name first to avoid duplicates if possible?
                // No, just create new.
                const resOrg = await client.query(`
                INSERT INTO public.organizations (name, plan, org_type, entity_type) 
                VALUES ($1, 'FREE', 'social_welfare', 'social_welfare') 
                RETURNING id
            `, [orgName]);

                const orgId = resOrg.rows[0].id;
                console.log(`  - Created Organization: ${orgId}`);

                // 4. Create Profile
                const fullName = user.raw_user_meta_data?.full_name || 'Restored User';

                await client.query(`
                INSERT INTO public.profiles (id, full_name, corporation_name, organization_id)
                VALUES ($1, $2, $3, $4)
            `, [user.id, fullName, orgName, orgId]);

                console.log(`  - Created Profile linked to Org.`);

            } else {
                console.log(`- Profile exists.`);
                // Check if linked to org
                const resProfileOrg = await client.query('SELECT organization_id FROM public.profiles WHERE id = $1', [user.id]);
                if (!resProfileOrg.rows[0].organization_id) {
                    console.log(`  - Profile has no organization. Creating...`);
                    const orgName = user.raw_user_meta_data?.corporation_name || 'Restored Corp';
                    const resOrg = await client.query(`
                    INSERT INTO public.organizations (name, plan, org_type, entity_type) 
                    VALUES ($1, 'FREE', 'social_welfare', 'social_welfare') 
                    RETURNING id
                `, [orgName]);
                    const orgId = resOrg.rows[0].id;
                    await client.query('UPDATE public.profiles SET organization_id = $1 WHERE id = $2', [orgId, user.id]);
                    console.log(`  - Linked new Organization to Profile.`);
                }
            }
        }
        console.log("Recovery complete.");

    } catch (err) {
        console.error("Error executing script", err);
    } finally {
        await client.end();
    }
}

main();
