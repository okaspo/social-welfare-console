'use server';

import { createClient } from '@/lib/supabase/server';
import { PlanPrice } from '@/lib/types';
import { revalidatePath } from 'next/cache';

export async function getPublicPrices(promoCode?: string): Promise<PlanPrice[]> {
    const supabase = await createClient();

    let query = supabase
        .from('plan_prices')
        .select('*');

    // Fetch all, then filter? Or complex OR condition.
    // Logic: is_public = true OR (campaign_code = promoCode)
    // Supabase .or() syntax: .or(`is_public.eq.true${promoCode ? `,campaign_code.eq.${promoCode}` : ''}`)

    if (promoCode) {
        query = query.or(`is_public.eq.true,campaign_code.eq.${promoCode}`);
    } else {
        query = query.eq('is_public', true);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching prices:', error);
        return [];
    }

    return (data as PlanPrice[]) || [];
}

export async function changePlan(orgId: string, priceId: string): Promise<void> {
    const supabase = await createClient();

    // 1. Get Price Info to verify existence and get associated plan_id
    const { data: price, error: priceError } = await supabase
        .from('plan_prices')
        .select('plan_id')
        .eq('id', priceId)
        .single();

    if (priceError || !price) {
        throw new Error('Invalid Price ID');
    }

    // 2. Update Organization
    // Only allow if user is owner/admin? (RLS should handle this, or we check role here)
    // Assuming RLS on 'organizations' allows UPDATE for members/owners.

    const { error: updateError } = await supabase
        .from('organizations')
        .update({
            plan_id: price.plan_id,
            current_price_id: priceId,
            // updated_at: new Date() // if column exists
        })
        .eq('id', orgId);

    if (updateError) {
        console.error('Error changing plan:', updateError);
        throw new Error('Failed to change plan');
    }

    revalidatePath('/dashboard/settings/billing');
}
