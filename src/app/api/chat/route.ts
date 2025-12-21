import { openai } from '@ai-sdk/openai';
import { streamText, ToolCallPart, ToolResultPart, tool } from 'ai';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { buildSystemPrompt } from '@/lib/prompt-builder';
import { checkUsageLimit, logUsage } from '@/lib/ai/usage-limiter';
import { selectModel, assessComplexity, calculateCost } from '@/lib/ai/model-router';
import { getSystemPromptForEntityType, getPersonaByEntityType } from '@/lib/ai/personas';

export const maxDuration = 60; // Increased for o1
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const messages = body?.messages || [];

        const supabase = await createClient();

        // 1. Check Auth & Get User Profile
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select(`
                full_name, 
                corporation_name, 
                organization_id,
                organizations (
                    id,
                    plan_id,
                    plan,
                    entity_type
                )
            `)
            .eq('id', user.id)
            .single();

        const userProfile = profile || { full_name: 'ゲスト', corporation_name: '未設定法人', organization_id: null, organizations: { plan_id: 'free', plan: 'free', entity_type: 'social_welfare' } };
        const orgId = userProfile.organization_id;
        const orgData = userProfile.organizations;
        // @ts-ignore
        const plan = (Array.isArray(orgData) ? orgData[0]?.plan : orgData?.plan) || 'free';
        // @ts-ignore
        const entityType = (Array.isArray(orgData) ? orgData[0]?.entity_type : orgData?.entity_type) || 'social_welfare';

        // Get persona based on entity type
        const persona = getPersonaByEntityType(entityType);
        const personaPrompt = persona.systemPrompt;

        // 2. Cost Control: Check Usage Limit (Initial Check)
        // 2. Cost Control: Check Usage Limit (Initial Check)
        if (orgId) {
            const { allowed, currentCost, limit } = await checkUsageLimit(orgId, plan);
            if (!allowed) {
                return new Response(JSON.stringify({ error: `Monthly usage limit reached (${currentCost}/${limit})` }), { status: 403 });
            }
        }

        // 3. Fetch All Context Data (Parallel)
        const fetchIfOrg = (query: any) => userProfile.organization_id ? query : Promise.resolve({ data: [] });

        const [knowledgeRes, documentsRes, officersRes, articlesRes] = await Promise.all([
            // [Common] Service Knowledge (active items) - Filter by entity type
            supabase.from('common_knowledge')
                .select('title, content, category')
                .eq('is_active', true)
                .or(`entity_type.is.null,entity_type.eq.common,entity_type.eq.${entityType}`),

            // [Individual] Managed Documents (Minutes etc.)
            fetchIfOrg(supabase.from('private_documents')
                .select('title, content, created_at')
                .eq('organization_id', userProfile.organization_id)
                .order('created_at', { ascending: false })
                .limit(3)),

            // [Individual] Officers
            fetchIfOrg(supabase.from('officers').select('name, role, term_end').eq('organization_id', userProfile.organization_id)),

            // [Individual] Articles (Regulations)
            fetchIfOrg(supabase.from('articles').select('title').eq('organization_id', userProfile.organization_id).limit(10))
        ]);

        // ... Context Construction ...
        let commonKnowledgeText = "";
        if (knowledgeRes.data && knowledgeRes.data.length > 0) {
            commonKnowledgeText = knowledgeRes.data
                .map((k: any) => `### 【${k.category}】${k.title}\n${k.content.substring(0, 3000)}...`)
                .join('\n\n');
        }

        let documentsText = "";
        if (documentsRes.data && documentsRes.data.length > 0) {
            documentsText = documentsRes.data
                .map((d: any) => `### [書類] ${d.title} (${new Date(d.created_at).toLocaleDateString()})\n${d.content ? d.content.substring(0, 1000) : '内容なし'}`)
                .join('\n\n');
        }

        const officersText = officersRes.data?.map((o: any) => `- ${o.name} (${o.role}, 任期: ${o.term_end})`).join('\n') || "なし";
        const articlesList = articlesRes.data?.map((a: any) => `- ${a.title}`).join('\n') || "なし";

        const systemPromptFull = await buildSystemPrompt(plan, user.id);

        // 4. Model Router (Reasoning Integration)
        const lastUserMessage = messages[messages.length - 1]?.content || '';
        const { detectIntent } = await import('@/lib/ai/intent-detector');

        const detectedIntent = detectIntent(lastUserMessage);

        const complexityResult = assessComplexity(lastUserMessage, messages.length > 5 ? 'long_history' : '');
        let taskComplexity = complexityResult.type;

        // Override with Intent Detector if specific
        if (detectedIntent.suggestedTier === 'advisor') taskComplexity = 'reasoning'; // Map advisor to reasoning logic
        else if (detectedIntent.suggestedTier === 'persona') taskComplexity = 'complex'; // Persona often equals complex in terms of needing 4o

        const selectedModel = selectModel(plan, complexityResult);

        console.log(`[Model Router] Intent: ${detectedIntent.intent} (${detectedIntent.confidence}) -> Plan: ${plan} -> Complexity: ${taskComplexity} -> Model: ${selectedModel}`);

        // Re-check quota including Reasoning Limits
        // Re-check quota including Reasoning Limits (omitted for now as redundant or needing specific reasoning-limit logic)
        // if (orgId) { ... }

        // 5. Build Final System Message with Persona
        const finalSystemMessage = `
${personaPrompt}

【ユーザー情報】
- ユーザー名: ${userProfile.full_name}
- 法人名: ${userProfile.corporation_name || '未設定'}
- 法人種別: ${persona.info.entityType === 'social_welfare' ? '社会福祉法人' : persona.info.entityType === 'npo' ? 'NPO法人' : persona.info.entityType === 'medical_corp' ? '医療法人' : '一般社団法人'}

【個別知識 (Individual Knowledge)】
この法人固有の情報です。質問がこの法人の内部事情に関するものである場合は、ここを最優先で参照してください。

[役員一覧]
${officersText}

[定款・規程一覧]
${articlesList}

[作成済み書類・議事録 (直近3件)]
${documentsText || "(書類はありません)"}

【共通知識 (Common Knowledge & Service Usage)】
サービスの仕様や、一般的な法令ルールです。

${commonKnowledgeText || "(共通知識はありません)"}

【注意】
- 「書類」や「議事録」の内容については、上記の [作成済み書類] セクションを参照して回答してください。
- サービスの機能についての質問（例：「議事録の作り方」）には、【共通知識】に含まれるサービスの仕様に基づいて回答してください。
`;

        // const { tool } = await import('ai'); // Already imported
        // const { z } = await import('zod');

        // const data = new StreamData();
        // if (taskComplexity === 'reasoning') {
        //     data.append({ status: 'thinking' });
        // }

        const result = await streamText({
            model: openai(selectedModel),
            system: finalSystemMessage,
            messages: messages,
            // onFinish: async () => {
            //     data.close();
            // },
            tools: {
                submit_feedback: tool({
                    description: 'ユーザーからの機能要望、バグ報告、その他フィードバックを運営チームに送信・保存します。',
                    parameters: z.object({
                        category: z.enum(['bug', 'feature', 'other']).describe('フィードバックの分類: バグ(bug), 要望(feature), その他(other)'),
                        content: z.string().describe('フィードバックの具体的な内容')
                    }),
                    execute: async ({ category, content }: { category: string, content: string }) => {
                        const { error } = await supabase.from('user_feedback').insert({
                            user_id: user.id,
                            category,
                            content
                        });
                        if (error) {
                            console.error('Feedback Error:', error);
                            return '申し訳ありません。フィードバックの送信中にエラーが発生しました。';
                        }
                        return 'フィードバックを送信しました。貴重なご意見ありがとうございます。';
                    }
                })
            },
            maxSteps: 3,
            onFinish: async (completion) => {
                // data.close();
                if (orgId) {
                    // Cast usage safely
                    const usage = completion.usage as any;
                    await logUsage({
                        organizationId: orgId,
                        featureName: 'chat_response',
                        userId: user.id,
                        model: selectedModel,
                        inputTokens: usage.promptTokens || 0,
                        outputTokens: usage.completionTokens || 0
                    });
                }
            }
        });

        // Use headers to signal reasoning mode
        const headers = new Headers();
        if (taskComplexity === 'reasoning') {
            headers.set('X-Reasoning-Mode', 'true');
        }

        // return result.toTextStreamResponse({ data });
        return result.toTextStreamResponse({ headers });

    } catch (error: any) {
        console.error("❌ [Chat API] Critical Error:", error);
        return new Response(JSON.stringify({ error: "Internal Server Error", details: error.message }), { status: 500 });
    }
}
