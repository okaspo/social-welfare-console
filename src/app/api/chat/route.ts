import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { buildSystemPrompt } from '@/lib/prompt-builder';
import { checkQuota, incrementUsage } from '@/lib/usage-guard';

export const maxDuration = 30; // 30 seconds max duration
export const dynamic = 'force-dynamic';

// Default Prompt (Fallback)
// Default Prompt (Fallback - Generic only)
export const JUDICIAL_SCRIVENER_PROMPT = `
あなたはAIアシスタントです。
現在、システムプロンプトの読み込みに失敗している可能性があります。
管理者に連絡してください。
`.trim();

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const messages = body?.messages || [];

        // Debug: Log request info


        const supabase = await createClient(); // Standard Client (User Context)

        // Admin Client for System Config (Bypass RLS for Prompts)
        const adminSupabase = createAdminClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

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
                    plan_id
                )
            `)
            .eq('id', user.id)
            .single();

        const userProfile = profile || { full_name: 'ゲスト', corporation_name: '未設定法人', organization_id: null, organizations: { plan_id: 'free' } };
        const orgId = userProfile.organization_id;
        const orgData = userProfile.organizations;
        // @ts-ignore
        const planId = (Array.isArray(orgData) ? orgData[0]?.plan_id : orgData?.plan_id) || 'free';

        // 2. Quota Check
        if (orgId) {
            const quota = await checkQuota(orgId, 'chat');
            if (!quota.ok) {
                return new Response(JSON.stringify({ error: quota.message || "Quota Exceeded" }), { status: 403 });
            }
        }

        // 2. Fetch All Context Data (Parallel)
        // We use .catch(() => ({ data: null })) pattern or just rely on supabase returning { data, error } without throwing
        // Supabase select() does not throw by default.

        // 2. Fetch All Context Data (Parallel)

        // Helper to allow conditional execution in Promise.all
        const fetchIfOrg = (query: any) => userProfile.organization_id ? query : Promise.resolve({ data: [] });

        const [knowledgeRes, documentsRes, officersRes, articlesRes] = await Promise.all([
            // [Common] Service Knowledge (active items)
            supabase.from('common_knowledge').select('title, content, category').eq('is_active', true),

            // [Individual] Managed Documents (Minutes etc.)
            fetchIfOrg(supabase.from('private_documents')
                .select('title, content, created_at')
                .eq('organization_id', userProfile.organization_id)
                .order('created_at', { ascending: false })
                .limit(3)),

            // [System] Custom System Prompt & Persona (Using Admin Client to guarantee access)
            // adminSupabase.from('system_prompts').select('name, content').in('name', ['default', 'aoi_persona']).eq('is_active', true),
            // Replaced by buildSystemPrompt below

            // [Individual] Officers
            fetchIfOrg(supabase.from('officers').select('name, role, term_end').eq('organization_id', userProfile.organization_id)),

            // [Individual] Articles (Regulations)
            fetchIfOrg(supabase.from('articles').select('title').eq('organization_id', userProfile.organization_id).limit(10))
        ]);



        // 3. Construct Context Strings

        // Common Knowledge
        let commonKnowledgeText = "";
        if (knowledgeRes.data && knowledgeRes.data.length > 0) {
            commonKnowledgeText = knowledgeRes.data
                .map((k: any) => `### 【${k.category}】${k.title}\n${k.content.substring(0, 3000)}...`)
                .join('\n\n');
        }

        // Individual: Documents
        let documentsText = "";
        if (documentsRes.data && documentsRes.data.length > 0) {
            documentsText = documentsRes.data
                .map((d: any) => `### [書類] ${d.title} (${new Date(d.created_at).toLocaleDateString()})\n${d.content ? d.content.substring(0, 1000) : '内容なし'}`)
                .join('\n\n');
        }

        // Individual: Officers
        const officersText = officersRes.data?.map((o: any) => `- ${o.name} (${o.role}, 任期: ${o.term_end})`).join('\n') || "なし";

        // Individual: Articles
        const articlesList = articlesRes.data?.map((a: any) => `- ${a.title}`).join('\n') || "なし";

        // System Prompt Base & Persona
        // const activePrompts = sysPromptRes.data || [];
        // const systemPromptBase = activePrompts.find((p: any) => p.name === 'default')?.content || JUDICIAL_SCRIVENER_PROMPT;
        // const personaContent = activePrompts.find((p: any) => p.name === 'aoi_persona')?.content || "";

        // Dynamic Prompt Builder (with user context)
        const systemPromptFull = await buildSystemPrompt(planId, user.id);


        // 4. Detect Intent and Select Model
        const lastUserMessage = messages[messages.length - 1]?.content || '';
        const { detectIntent, mapIntentToFeature } = await import('@/lib/ai/intent-detector');
        const { getModelForFeature } = await import('@/lib/ai/model-config');

        const detectedIntent = detectIntent(lastUserMessage);
        const feature = mapIntentToFeature(detectedIntent.intent);

        // Select appropriate model based on plan and intent
        let selectedModel = 'gpt-4o-mini'; // Default fallback
        try {
            selectedModel = getModelForFeature(feature, planId);
        } catch (error: any) {
            // If feature requires higher plan, return error
            if (error.message.includes('require')) {
                return new Response(
                    JSON.stringify({
                        error: 'この機能はProプラン以上で利用可能です',
                        requiredFeature: feature
                    }),
                    { status: 403 }
                );
            }
        }

        console.log(`[Model Router] Intent: ${detectedIntent.intent} → Model: ${selectedModel} (Confidence: ${detectedIntent.confidence})`);

        // 5. Build Final System Message
        const finalSystemMessage = `
${systemPromptFull}

【ユーザー情報】
- ユーザー名: ${userProfile.full_name}
- 法人名: ${userProfile.corporation_name || '未設定'}

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



        const { tool } = await import('ai');
        const { z } = await import('zod');

        const result = await streamText({
            model: openai(selectedModel),
            system: finalSystemMessage,
            messages: messages,
            tools: {
                submit_feedback: tool({
                    description: 'ユーザーからの機能要望、バグ報告、その他フィードバックを運営チームに送信・保存します。',
                    parameters: z.object({
                        category: z.enum(['bug', 'feature', 'other']).describe('フィードバックの分類: バグ(bug), 要望(feature), その他(other)'),
                        content: z.string().describe('フィードバックの具体的な内容')
                    }),
                    execute: async ({ category, content }) => {
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
            maxSteps: 3, // Allow tool execution and response
            onFinish: async (completion) => {
                // Increment Usage
                if (orgId) await incrementUsage(orgId, 'chat');

                // Log model selection for analytics
                const adminSupabase = createAdminClient(
                    process.env.NEXT_PUBLIC_SUPABASE_URL!,
                    process.env.SUPABASE_SERVICE_ROLE_KEY!
                );

                await adminSupabase.from('model_router_logs').insert({
                    organization_id: orgId,
                    user_id: user.id,
                    user_message: lastUserMessage.substring(0, 500),
                    detected_intent: detectedIntent.intent,
                    selected_tier: detectedIntent.suggestedTier,
                    selected_model: selectedModel,
                    was_overridden: false,
                });
            }
        });

        return result.toTextStreamResponse();

    } catch (error: any) {
        console.error("❌ [Chat API] Critical Error:", error);
        return new Response(JSON.stringify({ error: "Internal Server Error", details: error.message }), { status: 500 });
    }
}
