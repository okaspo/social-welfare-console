'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// ============================================================================
// Types
// ============================================================================

export interface Campaign {
    id: string;
    code: string;
    name: string;
    description?: string;
    target_entity_type: string;
    discount_percent: number;
    target_plan: string;
    max_uses?: number;
    current_uses: number;
    starts_at: string;
    expires_at?: string;
    is_active: boolean;
    created_at: string;
}

// ============================================================================
// Server Actions
// ============================================================================

/**
 * Get all campaigns (admin only)
 */
export async function getCampaigns(): Promise<Campaign[]> {
    const supabase = await createClient();

    const { data: campaigns, error } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching campaigns:', error);
        return [];
    }

    return campaigns || [];
}

/**
 * Create a new campaign
 */
export async function createCampaign(formData: FormData): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { success: false, error: 'Unauthorized' };
    }

    const code = (formData.get('code') as string)?.toUpperCase().trim();
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const targetEntityType = formData.get('target_entity_type') as string;
    const discountPercent = parseInt(formData.get('discount_percent') as string) || 0;
    const targetPlan = formData.get('target_plan') as string || 'starter';
    const maxUses = formData.get('max_uses') ? parseInt(formData.get('max_uses') as string) : null;
    const expiresAt = formData.get('expires_at') as string || null;

    if (!code || !name) {
        return { success: false, error: 'Code and name are required' };
    }

    const { error } = await supabase
        .from('campaigns')
        .insert({
            code,
            name,
            description,
            target_entity_type: targetEntityType || 'social_welfare',
            discount_percent: discountPercent,
            target_plan: targetPlan,
            max_uses: maxUses,
            expires_at: expiresAt,
            created_by: user.id
        });

    if (error) {
        if (error.code === '23505') {
            return { success: false, error: 'このキャンペーンコードは既に存在します' };
        }
        return { success: false, error: error.message };
    }

    revalidatePath('/admin/campaigns');
    return { success: true };
}

/**
 * Toggle campaign active status
 */
export async function toggleCampaignStatus(campaignId: string, isActive: boolean): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();

    const { error } = await supabase
        .from('campaigns')
        .update({ is_active: isActive })
        .eq('id', campaignId);

    if (error) {
        return { success: false, error: error.message };
    }

    revalidatePath('/admin/campaigns');
    return { success: true };
}

/**
 * Delete a campaign
 */
export async function deleteCampaign(campaignId: string): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();

    const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', campaignId);

    if (error) {
        return { success: false, error: error.message };
    }

    revalidatePath('/admin/campaigns');
    return { success: true };
}

/**
 * Verify a campaign code (for signup)
 */
export async function verifyCampaignCode(code: string): Promise<{
    valid: boolean;
    campaign?: {
        entityType: string;
        discount: number;
        plan: string;
        name: string;
    };
    error?: string;
}> {
    const supabase = await createClient();

    const { data: campaign, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('code', code.toUpperCase().trim())
        .eq('is_active', true)
        .single();

    if (error || !campaign) {
        return { valid: false, error: '無効なキャンペーンコードです' };
    }

    // Check expiry
    if (campaign.expires_at && new Date(campaign.expires_at) < new Date()) {
        return { valid: false, error: 'このキャンペーンは終了しています' };
    }

    // Check max uses
    if (campaign.max_uses && campaign.current_uses >= campaign.max_uses) {
        return { valid: false, error: 'このキャンペーンは上限に達しています' };
    }

    return {
        valid: true,
        campaign: {
            entityType: campaign.target_entity_type,
            discount: campaign.discount_percent,
            plan: campaign.target_plan,
            name: campaign.name
        }
    };
}
