// Subsidy AI Matcher - Killer Feature
// Match organizations with eligible subsidies using AI

'use server';

import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// Lazy initialize OpenAI client to avoid build-time errors
function getOpenAIClient() {
    return new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
}

interface SubsidyMatch {
    subsidy_id: string;
    title: string;
    provider: string;
    amount_min: number;
    amount_max: number;
    match_score: number;
    match_reason: string;
    deadline: string;
}

/**
 * AI-powered subsidy matching
 */
export async function matchSubsidies(organizationId: string): Promise<{
    matches: SubsidyMatch[];
    error?: string;
}> {
    try {
        const adminSupabase = createAdminClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // 1. Get organization profile
        const { data: org } = await adminSupabase
            .from('organizations')
            .select('*, officers(name, role, expertise_tags)')
            .eq('id', organizationId)
            .single();

        if (!org) {
            return { matches: [], error: 'Organization not found' };
        }

        // 2. Get available subsidies
        const { data: subsidies } = await adminSupabase
            .from('subsidies')
            .select('*')
            .eq('is_active', true)
            .gte('application_period_end', new Date().toISOString().split('T')[0])
            .contains('target_entity_types', [org.entity_type]);

        if (!subsidies || subsidies.length === 0) {
            return { matches: [], error: 'No active subsidies found' };
        }

        // 3. Build organization profile for AI
        const orgProfile = buildOrganizationProfile(org);

        // 4. Use AI to match subsidies
        const matches: SubsidyMatch[] = [];

        for (const subsidy of subsidies.slice(0, 10)) { // Limit to avoid high costs
            const matchResult = await evaluateSubsidyMatch(orgProfile, subsidy);

            if (matchResult.score >= 0.6) {
                matches.push({
                    subsidy_id: subsidy.id,
                    title: subsidy.title,
                    provider: subsidy.provider,
                    amount_min: subsidy.amount_min,
                    amount_max: subsidy.amount_max,
                    match_score: matchResult.score,
                    match_reason: matchResult.reason,
                    deadline: subsidy.application_period_end,
                });
            }
        }

        // 5. Sort by match score
        matches.sort((a, b) => b.match_score - a.match_score);

        // 6. Save matches to database
        for (const match of matches) {
            await adminSupabase
                .from('organization_subsidies')
                .upsert({
                    organization_id: organizationId,
                    subsidy_id: match.subsidy_id,
                    match_score: match.match_score,
                    match_reason: match.match_reason,
                    status: 'matched',
                }, {
                    onConflict: 'organization_id,subsidy_id',
                });
        }

        return { matches };
    } catch (error: any) {
        console.error('Subsidy matching error:', error);
        return { matches: [], error: error.message };
    }
}

/**
 * Build organization profile string
 */
function buildOrganizationProfile(org: any): string {
    const officers = org.officers || [];
    const expertiseTags = officers
        .flatMap((o: any) => o.expertise_tags || [])
        .filter((tag: string, index: number, self: string[]) => self.indexOf(tag) === index);

    return `
法人名: ${org.name}
法人種別: ${org.entity_type}
事業内容: ${org.business_type || '未設定'}
専門性: ${expertiseTags.join(', ') || '未設定'}
役員数: ${officers.length}名
`.trim();
}

/**
 * Use AI to evaluate subsidy match
 */
async function evaluateSubsidyMatch(
    orgProfile: string,
    subsidy: any
): Promise<{ score: number; reason: string }> {
    const prompt = `
あなたは助成金マッチングの専門家です。

# 組織プロフィール
${orgProfile}

# 助成金情報
- タイトル: ${subsidy.title}
- 提供: ${subsidy.provider}
- カテゴリ: ${subsidy.category}
- 対象事業: ${subsidy.target_business_types?.join(', ') || '制限なし'}
- 要件: ${JSON.stringify(subsidy.requirements || {})}
- 金額: ¥${subsidy.amount_min?.toLocaleString('ja-JP')} ~ ¥${subsidy.amount_max?.toLocaleString('ja-JP')}

# タスク
この組織がこの助成金に適合する可能性を0-1のスコアで判定してください。

# 出力形式 (JSON)
{
  "score": 0.85,
  "reason": "この組織は高齢者福祉施設を運営しており、当助成金の対象である施設整備事業に該当します。また、財務の専門家が役員に含まれており、申請要件を満たす可能性が高いです。"
}

CRITICAL:
- スコアは厳格に判定してください（適合度が低い場合は0.3以下）
- 理由は具体的に、組織の特性と助成金要件の対応関係を説明してください
`.trim();

    try {
        const completion = await getOpenAIClient().chat.completions.create({
            model: 'gpt-4o',
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: 'json_object' },
            temperature: 0.3,
        });

        const result = JSON.parse(completion.choices[0].message.content || '{}');
        return {
            score: result.score || 0,
            reason: result.reason || 'マッチング評価に失敗しました',
        };
    } catch (error) {
        console.error('AI evaluation error:', error);
        return { score: 0, reason: 'AI評価エラー' };
    }
}

/**
 * Update subsidy application status
 */
export async function updateSubsidyStatus(
    organizationId: string,
    subsidyId: string,
    status: 'reviewing' | 'applied' | 'granted' | 'rejected' | 'ignored'
): Promise<{ success: boolean; error?: string }> {
    try {
        const adminSupabase = createAdminClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const updateData: any = { status };

        if (status === 'applied') {
            updateData.applied_at = new Date().toISOString();
        } else if (status === 'granted' || status === 'rejected') {
            updateData.result_at = new Date().toISOString();
        }

        const { error } = await adminSupabase
            .from('organization_subsidies')
            .update(updateData)
            .eq('organization_id', organizationId)
            .eq('subsidy_id', subsidyId);

        if (error) throw error;

        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
