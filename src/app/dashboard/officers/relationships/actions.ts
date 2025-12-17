'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function addRelationship(officerId1: string, officerId2: string, type: string) {
    const supabase = await createClient();

    // Ensure ID sorting to match CHECK constraint (officer_id_a < officer_id_b)
    const [idA, idB] = [officerId1, officerId2].sort();

    // Get current user's organization
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

    if (!profile?.organization_id) throw new Error('No organization');

    const { error } = await supabase
        .from('officer_relationships')
        .insert({
            organization_id: profile.organization_id,
            officer_id_a: idA,
            officer_id_b: idB,
            relationship_type: type
        });

    if (error) {
        console.error('Failed to add relationship', error);
        throw new Error('Failed to add relationship');
    }

    revalidatePath('/dashboard/officers/relationships');
}

export async function removeRelationship(relationshipId: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('officer_relationships')
        .delete()
        .eq('id', relationshipId);

    if (error) {
        throw new Error('Failed to remove relationship');
    }

    revalidatePath('/dashboard/officers/relationships');
}
