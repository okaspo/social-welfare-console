import { createClient } from '@/lib/supabase/server';
import { executeLegalCheck } from '@/lib/ai/supervisor';
import { checkUsageLimit, logUsage } from '@/lib/ai/usage-limiter';
import { getModelTier } from '@/lib/ai/model-config';

export async function POST(req: Request) {
    try {
        const { messageId, content, history, feature = 'governance_check', contextOverride } = await req.json();

        // 1. Auth Check
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }

        // Get Org ID
        const { data: profile } = await supabase
            .from('profiles')
            .select(`organization_id, organizations(plan, plan_id)`)
            .eq('id', user.id)
            .single();

        const orgId = profile?.organization_id;
        // @ts-ignore
        const plan = profile?.organizations?.plan || 'free';

        if (!orgId) {
            return new Response(JSON.stringify({ error: 'Organization not found' }), { status: 400 });
        }

        // 2. Usage Check (Reasoning is expensive)
        const check = await checkUsageLimit(orgId, plan);
        // Note: usage-limiter might need an explicit 'o1' check function if not covered by generic check.
        if (!check.allowed) {
            return new Response(JSON.stringify({ error: 'Usage limit exceeded' }), { status: 403 });
        }

        // 3. Execute Legal Check (Supervisor Pattern)
        // Extract context from history if not provided
        let context = contextOverride || '';
        if (!context && history) {
            // Simple concatenation of recent history as context
            context = history.map((m: any) => `${m.role}: ${m.content}`).join('\n');
        }

        const result = await executeLegalCheck({
            feature: feature,
            userPlan: plan,
            context: context,
            userInput: content,
            assistantPersona: 'aoi' // Default to Aoi for SWC
        });

        // 4. Log Usage
        if (result.cost) {
            await logUsage({
                organizationId: orgId,
                userId: user.id,
                featureName: feature,
                model: result.reasoning.model as any,
                inputTokens: 0,
                outputTokens: 0,
            });
        }

        // 5. Save to Audit Log
        const { error: logError } = await supabase.from('legal_check_logs').insert({
            organization_id: orgId,
            user_id: user.id,
            user_input: content,
            o1_raw_output: result.reasoning,
            translated_explanation: result.translation.userFriendlyExplanation,
            is_compliant: result.reasoning.conclusion === 'compliant',
            legal_references: result.reasoning.citations
        });

        if (logError) console.error('Failed to audit log:', logError);

        return new Response(JSON.stringify(result), { status: 200 });

    } catch (error: any) {
        console.error('Precision Check Error:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
