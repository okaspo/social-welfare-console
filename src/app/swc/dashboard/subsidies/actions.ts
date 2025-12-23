'use server';

import { createClient } from '@/lib/supabase/server';
import { matchSubsidies } from '@/lib/subsidies/matcher';
import { revalidatePath } from 'next/cache';

export async function refreshMatches() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    // Get Organization ID
    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

    if (profile?.organization_id) {
        await matchSubsidies(profile.organization_id);
    }

    revalidatePath('/swc/dashboard/subsidies');
}
