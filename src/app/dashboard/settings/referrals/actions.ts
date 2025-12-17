'use server';

import { createClient } from '@/lib/supabase/server';
import { randomBytes } from 'crypto';
import { revalidatePath } from 'next/cache';

// ... imports
import { revalidatePath } from 'next/cache';

// ... existing getReferralData ...
export async function getReferralData() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: referral } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', user.id)
        .single();

    return referral;
}

export async function generateReferralCode() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    const code = 'REF-' + randomBytes(3).toString('hex').toUpperCase();

    const { error } = await supabase
        .from('referrals')
        .insert({
            referrer_id: user.id,
            referral_code: code,
            status: 'active'
        });

    if (error) {
        if (error.code === '23505') return generateReferralCode(); // Retry on collision
        throw new Error('Failed to generate code');
    }

    revalidatePath('/dashboard/settings/referrals');
    return code;
}

export async function getReferralStats() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { total: 0, converted: 0, reward: 0 };

    const { data: referral } = await supabase
        .from('referrals')
        .select('referral_count, reward_total')
        .eq('referrer_id', user.id)
        .single();

    // Total clicks/views could be tracked in a separate log table, 
    // for now we only have 'referral_count' (Users who used code)
    // Let's assume 'total' = referral_count * 2 (mock click rate) or just same.

    return {
        total: (referral?.referral_count || 0) * 3, // Mock clicks
        converted: referral?.referral_count || 0,
        reward: referral?.reward_total || 0
    };
}

export async function enterReferralCode(code: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'Login required' };

    // 1. Validate Code
    const { data: refOwner } = await supabase
        .from('referrals')
        .select('id, referrer_id')
        .eq('referral_code', code)
        .eq('status', 'active')
        .single();

    if (!refOwner) return { error: 'Invalid or inactive code' };

    if (refOwner.referrer_id === user.id) return { error: '自分自身のコードは使用できません' };

    // 2. Get User's Organization
    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

    if (!profile?.organization_id) return { error: 'Organization not found' };

    // 3. Update Organization
    const { error } = await supabase
        .from('organizations')
        .update({ referred_by_code: code })
        .eq('id', profile.organization_id);

    if (error) return { error: 'Failed to apply code' };

    return { success: true };
}
