import { createClient } from '@/lib/supabase/server';
import { PlanType, PlanFeatures, PlanLimit, OrganizationUsage } from '@/lib/types';

export async function checkUsage(
    orgId: string,
    planId: PlanType,
    feature: keyof PlanFeatures | 'chat_message' | 'doc_gen' | 'storage_mb',
    incomingAmount: number = 0
): Promise<boolean> {
    const supabase = await createClient();

    // 1. Fetch Plan Limits
    const { data: limitData, error: limitError } = await supabase
        .from('plan_limits')
        .select('*')
        .eq('plan_id', planId)
        .single();

    if (limitError || !limitData) {
        throw new Error(`Failed to fetch plan limits for plan: ${planId}`);
    }

    const limits = limitData as PlanLimit;

    // 2. Check Feature Flags first
    if (feature !== 'chat_message' && feature !== 'doc_gen' && feature !== 'storage_mb') {
        const isEnabled = limits.features[feature as keyof PlanFeatures];
        if (!isEnabled) {
            throw new Error(`Feature '${String(feature)}' is not available on your current plan.`);
        }
        return true;
    }

    // 3. For numeric limits, fetch Usage
    const currentMonth = new Date().toISOString().slice(0, 7) + '-01'; // YYYY-MM-01

    const { data: usageData, error: usageError } = await supabase
        .from('organization_usage')
        .select('*')
        .eq('organization_id', orgId)
        .eq('current_month', currentMonth)
        .single();

    const usage = usageData as OrganizationUsage | null;
    const currentUsage = {
        chat: usage?.chat_count || 0,
        doc: usage?.doc_gen_count || 0,
        storage: usage?.storage_used_mb || 0
    };

    // 4. Check Numeric Limits
    if (feature === 'chat_message') {
        if (limits.monthly_chat_limit !== -1 && (currentUsage.chat + incomingAmount) > limits.monthly_chat_limit) {
            throw new Error(`Monthly chat limit reached (${currentUsage.chat}/${limits.monthly_chat_limit}). Upgrade your plan.`);
        }
    } else if (feature === 'doc_gen') {
        if (limits.monthly_doc_gen_limit !== -1 && (currentUsage.doc + incomingAmount) > limits.monthly_doc_gen_limit) {
            throw new Error(`Monthly document generation limit reached (${currentUsage.doc}/${limits.monthly_doc_gen_limit}). Upgrade your plan.`);
        }
    } else if (feature === 'storage_mb') {
        if (limits.storage_limit_mb !== -1 && (currentUsage.storage + incomingAmount) > limits.storage_limit_mb) {
            throw new Error(`Storage limit reached (${currentUsage.storage}MB + ${incomingAmount}MB > ${limits.storage_limit_mb}MB).`);
        }
    }

    return true;
}

export async function incrementUsage(
    orgId: string,
    metric: 'chat' | 'doc_gen' | 'storage',
    amount: number = 1
): Promise<void> {
    const supabase = await createClient();
    const currentMonth = new Date().toISOString().slice(0, 7) + '-01';

    // Upsert usage
    // We need to handle the case where the row doesn't exist.
    // Supabase upset can handle this if we have a unique constraint on (organization_id, current_month).

    // Construct dynamic update
    const updatePayload: any = {
        organization_id: orgId,
        current_month: currentMonth,
        updated_at: new Date().toISOString()
    };

    // We can't easily do "increment" in a simple upsert via JS client without RPC or reading first.
    // RPC is better for atomic increment.
    // For now, let's read-then-update (or try insert).

    // Ideally we use an RPC function like `increment_usage(org_id, metric, amount)`.
    // But since I can't write RPC right now without migration, I will do read-modify-write (less safe but acceptable for prototype).
    // Or I can use `upsert` if I fetch first.

    const { data: existing } = await supabase
        .from('organization_usage')
        .select('*')
        .eq('organization_id', orgId)
        .eq('current_month', currentMonth)
        .single();

    if (existing) {
        const updateData: any = {};
        if (metric === 'chat') updateData.chat_count = existing.chat_count + amount;
        if (metric === 'doc_gen') updateData.doc_gen_count = existing.doc_gen_count + amount;
        if (metric === 'storage') updateData.storage_used_mb = existing.storage_used_mb + amount;

        await supabase
            .from('organization_usage')
            .update(updateData)
            .eq('id', existing.id);
    } else {
        const insertData: any = {
            organization_id: orgId,
            current_month: currentMonth,
            chat_count: metric === 'chat' ? amount : 0,
            doc_gen_count: metric === 'doc_gen' ? amount : 0,
            storage_used_mb: metric === 'storage' ? amount : 0
        };
        await supabase.from('organization_usage').insert(insertData);
    }
}
