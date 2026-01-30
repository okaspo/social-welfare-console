
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
    console.log('Inspecting Profiles...');
    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*');

    if (error) {
        console.error('Error fetching profiles:', error);
        return;
    }

    console.log(`Found ${profiles.length} profiles.`);

    const detached = profiles.filter(p => !p.organization_id);
    if (detached.length > 0) {
        console.log('⚠️  WARNING: Found profiles without Organization ID:');
        console.table(detached.map(p => ({ id: p.id, email: p.email, full_name: p.full_name })));
    } else {
        console.log('✅  All profiles have an Organization ID.');
    }

    console.log('Inspecting Organizations...');
    const { data: orgs } = await supabase.from('organizations').select('id, name');
    console.table(orgs);
}

main();
