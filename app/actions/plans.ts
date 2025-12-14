'use server';

import { createClient } from '@/lib/supabase/server';
import { PlanLimit, PlanType } from '@/lib/types';
import { revalidatePath } from 'next/cache';

export async function getPlans(): Promise<PlanLimit[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('plan_limits')
        .select('*')
        .order('monthly_chat_limit', { ascending: true }); // Rough ordering by "tier"

    if (error) {
        console.error('Error fetching plans:', error);
        throw new Error('Failed to fetch plans');
    }

    return (data as PlanLimit[]) || [];
}

export async function updatePlan(planId: PlanType, updates: Partial<PlanLimit>): Promise<void> {
    const supabase = await createClient();

    // Prepare update payload
    // We only allow updating specific fields
    const safeUpdates: any = {};

    if (updates.monthly_chat_limit !== undefined) safeUpdates.monthly_chat_limit = updates.monthly_chat_limit;
    if (updates.monthly_doc_gen_limit !== undefined) safeUpdates.monthly_doc_gen_limit = updates.monthly_doc_gen_limit;
    if (updates.storage_limit_mb !== undefined) safeUpdates.storage_limit_mb = updates.storage_limit_mb;
    if (updates.max_users !== undefined) safeUpdates.max_users = updates.max_users;
    if (updates.features !== undefined) safeUpdates.features = updates.features;

    const { error } = await supabase
        .from('plan_limits')
        .update(safeUpdates)
        .eq('plan_id', planId);

    if (error) {
        console.error('Error updating plan:', error);
        throw new Error('Failed to update plan');
    }

    revalidatePath('/dashboard/admin/plans');
}

export async function getPlanPrices(planId: string): Promise<any[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('plan_prices')
        .select('*')
        .eq('plan_id', planId)
        .order('amount', { ascending: true });

    if (error) {
        console.error('Error fetching plan prices:', error);
        return [];
    }
    return data || [];
}

export async function addPrice(priceData: any): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase.from('plan_prices').insert(priceData);

    if (error) {
        console.error('Error adding price:', error);
        throw new Error('Failed to add price');
    }
    revalidatePath('/dashboard/admin/plans');
}

export async function deletePrice(priceId: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase.from('plan_prices').delete().eq('id', priceId);

    if (error) {
        console.error('Error deleting price:', error);
        throw new Error('Failed to delete price');
    }
    revalidatePath('/dashboard/admin/plans');
}
