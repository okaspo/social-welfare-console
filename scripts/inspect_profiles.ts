
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Try to load .env.local first, then fall back to .env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config(); // Load .env as fallback (dotenv won't overwrite existing keys)

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
    console.log('Inspecting Profiles...');
    const { data: profiles, error } = await supabase
        .from('profiles')
        .select(`
            *,
            organization:organizations(id, name)
        `);

    if (error) {
        console.error('Error fetching profiles:', error);
        return;
    }

    console.log(`Found ${profiles.length} profiles.`);

    const detached = profiles.filter(p => !p.organization_id);
    if (detached.length > 0) {
        console.log('⚠️  WARNING: Found profiles without Organization ID:');
        console.table(detached.map(p => ({
            id: p.id,
            full_name: p.full_name,
            org: 'NULL'
        })));
    } else {
        console.log('✅  All profiles have an Organization ID.');
    }

    console.table(profiles.map(p => ({
        id: p.id,
        full_name: p.full_name,
        role: p.role,
        org_name: p.organization?.name || 'UNKNOWN',
        org_id: p.organization_id
    })));

    console.log('Inspecting Organizations...');
    const { data: orgs } = await supabase.from('organizations').select('id, name');
    console.table(orgs);
}

main();
