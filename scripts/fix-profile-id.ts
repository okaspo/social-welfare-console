
const { Client } = require('pg');

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:-%26A4xbg8Q%21%23G%2BSr@db.baayjlwyxjplwuteiyne.supabase.co:5432/postgres";

async function main() {
    const client = new Client({ connectionString });

    try {
        await client.connect();

        // 1. Get the Auth ID for the target email (assuming it is the one we saw 'qubo_...')
        // Since I cannot read the full email from previous logs reliably without being sure, I will list auth users again to grab the ID dynamically if matching a pattern, OR just hardcode the one I saw if I am sure.
        // ID seen: '6408221b-c682-4161-90a8-046645550302'

        const authId = '6408221b-c682-4161-90a8-046645550302';
        const profileIdToReplace = 'd0235961-f916-4f70-befd-38b2a3813cea'; // "久保潤一郎"

        console.log(`Updating Profile ID from ${profileIdToReplace} to ${authId}...`);

        // Update Profile ID
        // Note: ID is PK, might have FKs.
        // Check for FKs first? 'officers.user_id' might reference it?
        // But officers were deleted.
        // 'users' (auth.users) is the parent of profiles.id usually (FK user_id).
        // public.profiles table usually has id as PK and References auth.users(id).

        // If public.profiles.id references auth.users.id, then we CANNOT insert 'd0235961' if it doesn't exist in auth.users.
        // Does 'd0235961' exist in auth.users?
        // Probably not. That's why it was a mismatch.

        // So 'd0235961' in profiles is an orphan or created manually without FK constraint?

        // UPDATE public.profiles SET id = '...' WHERE id = '...'
        // This requires the new ID '6408221b' to exist in auth.users (IT DOES).

        await client.query(`
            UPDATE public.profiles 
            SET id = $1 
            WHERE id = $2
        `, [authId, profileIdToReplace]);

        console.log("Profile ID updated successfully.");

    } catch (err) {
        console.error("Error updating profile ID:", err);
    } finally {
        await client.end();
    }
}

main();
