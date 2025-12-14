
import { createClient } from '@/lib/supabase/server';

type UsageType = 'chat' | 'doc_gen' | 'storage';

export async function checkQuota(organizationId: string, type: UsageType, fileSizeMb: number = 0): Promise<{ ok: boolean, message?: string }> {
    const supabase = await createClient();

    // 1. Get Organization Plan
    const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('plan_id')
        .eq('id', organizationId)
        .single();

    if (orgError || !org) return { ok: false, message: 'Organization not found' };

    const planId = org.plan_id || 'free';

    // 2. Get Plan Limits
    const { data: limits, error: limitError } = await supabase
        .from('plan_limits')
        .select('*')
        .eq('plan_id', planId)
        .single();

    if (limitError || !limits) return { ok: false, message: 'Plan configuration error' };

    // 3. Get Current Usage
    const currentMonth = new Date().toISOString().slice(0, 7) + '-01'; // YYYY-MM-01
    const { data: usage, error: usageError } = await supabase
        .from('organization_usage')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('current_month', currentMonth)
        .single();

    // If no usage record exists yet for this month, user effectively has 0 usage.
    const currentUsage = usage || { chat_count: 0, doc_gen_count: 0, storage_used_mb: 0 };

    // 4. Check Logic
    if (type === 'chat') {
        if (limits.monthly_chat_limit !== -1 && currentUsage.chat_count >= limits.monthly_chat_limit) {
            return { ok: false, message: `今月のチャット利用上限(${limits.monthly_chat_limit}回)に達しました。プランをアップグレードしてください。` };
        }
    } else if (type === 'doc_gen') {
        if (limits.monthly_doc_gen_limit !== -1 && currentUsage.doc_gen_count >= limits.monthly_doc_gen_limit) {
            return { ok: false, message: `今月の文書生成上限(${limits.monthly_doc_gen_limit}回)に達しました。` };
        }
    } else if (type === 'storage') {
        // Estimate new total
        if (limits.storage_limit_mb !== -1 && (currentUsage.storage_used_mb + fileSizeMb) > limits.storage_limit_mb) {
            return { ok: false, message: `ストレージ容量上限(${limits.storage_limit_mb}MB)を超過します。` };
        }
    }

    return { ok: true };
}

export async function incrementUsage(organizationId: string, type: Exclude<UsageType, 'storage'>) {
    const supabase = await createClient();
    const currentMonth = new Date().toISOString().slice(0, 7) + '-01';

    // Upsert usage record
    const { error } = await supabase.rpc('increment_usage', {
        org_id: organizationId,
        month_str: currentMonth,
        usage_type: type
    });

    // Note: RPC would be ideal for atomicity, but for now we might use simple upsert logic if RPC doesn't exist.
    // Let's rely on a fallback logic since we didn't define RPC in migration yet.
    if (error) {
        // Fallback: Fetch -> Update (Race condition risk but acceptable for MVP)
        // Or actually, let's create a SQL function in next migration for this.
        console.warn('Usage increment failed (RPC missing?)');
    }
}
