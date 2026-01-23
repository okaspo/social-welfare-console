import { openai } from '@ai-sdk/openai';
import { streamText, ToolCallPart, ToolResultPart, tool } from 'ai';
import { z } from 'zod';
import { createClientFromRequest } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { buildSystemPrompt } from '@/lib/prompt-builder';
import { checkUsageLimit, logUsage } from '@/lib/ai/usage-limiter';
import { selectModel, assessComplexity, calculateCost } from '@/lib/ai/model-router';
import { getSystemPromptForEntityType, getPersonaByEntityType } from '@/lib/ai/personas';

export const maxDuration = 60; // Increased for o1
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        console.log('[Chat API] Starting request...');

        const body = await req.json();
        const messages = body?.messages || [];

        console.log('[Chat API] Messages count:', messages.length);

        // Create Supabase client outside try-catch so it's accessible everywhere
        console.log('[Chat API] Creating Supabase client from request...');
        const supabase = createClientFromRequest(req);

        // Try to get user, but continue with fallback if it fails
        let user: any = null;

        try {
            console.log('[Chat API] Getting user...');
            const { data, error: authError } = await supabase.auth.getUser();
            user = data?.user;

            if (authError) {
                console.error('[Chat API] Auth error:', authError.message);
            }
        } catch (authErr: any) {
            console.error('[Chat API] Auth exception:', authErr.message);
        }

        // Log user status
        if (!user) {
            console.log('[Chat API] No user found, continuing with guest mode');
        } else {
            console.log('[Chat API] User found:', user.id);
        }

        // Get profile - use optional chaining and fallback
        let profile: any = null;
        if (user) {
            try {
                const { data } = await supabase
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
                profile = data;
            } catch (profileErr: any) {
                console.error('[Chat API] Profile fetch error:', profileErr.message);
            }
        }

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
        else if (detectedIntent.suggestedTier === 'persona') taskComplexity = 'legal'; // Persona often equals legal in terms of needing 4o

        // Get Primary Model (Gemini or OpenAI based on logic)
        let selectedModel = selectModel(plan, complexityResult);
        let activeComplexity = taskComplexity;

        console.log(`[Model Router] Intent: ${detectedIntent.intent} -> Complexity: ${taskComplexity} -> Primary Model Selected`);

        // Re-check quota including Reasoning Limits
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

        // Execute Stream with Fallback Logic
        let result;
        try {
            result = await streamText({
                model: selectedModel,
                system: finalSystemMessage,
                messages: messages,
            });
        } catch (primaryError: any) {
            console.warn(`[Chat API] Primary model failed: ${primaryError.message}. Attempting fallback...`);

            // Fallback logic
            const { getFallbackModel } = await import('@/lib/ai/model-router');
            const fallbackModel = getFallbackModel(taskComplexity);

            console.log(`[Chat API] Switching to fallback model for task: ${taskComplexity}`);

            result = await streamText({
                model: fallbackModel,
                system: finalSystemMessage,
                messages: messages,
            });
        }

        // Use headers to signal reasoning mode
        const headers = new Headers();
        if (taskComplexity === 'reasoning') {
            headers.set('X-Reasoning-Mode', 'true');
            console.log('[Chat API] Reasoning mode active (o1/o3)');
        }

        // Custom Streaming Implementation using NDJSON
        // This ensures robust streaming regardless of SDK methods
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    // @ts-ignore - fullStream exists in v5
                    // DEBUG: Send start event
                    controller.enqueue(new TextEncoder().encode(JSON.stringify({ type: 'debug', value: 'Stream started' }) + '\n'));

                    for await (const part of result.fullStream) {
                        const chunk = {
                            type: part.type,
                            // @ts-ignore
                            value: part.type === 'text-delta' ? (part.textDelta || part.text) :
                                // @ts-ignore
                                part.type === 'tool-call' ? (part.toolCallName || part.toolName) :
                                    // @ts-ignore
                                    part.type === 'error' ? (part.error instanceof Error ? part.error.message : String(part.error)) : null,
                            raw: part.type === 'error' ? { message: String(part.error) } : part // Send raw part for debugging, careful with Error objects
                        };
                        // Filter out empty text updates to reduce noise
                        if (chunk.type === 'text-delta' && !chunk.value) continue;

                        const json = JSON.stringify(chunk);
                        controller.enqueue(new TextEncoder().encode(json + '\n'));
                    }
                    // DEBUG: Send finish event
                    controller.enqueue(new TextEncoder().encode(JSON.stringify({ type: 'debug', value: 'Stream finished' }) + '\n'));
                    controller.close();
                } catch (error) {
                    console.error('[Chat API] Stream error:', error);
                    const errorChunk = JSON.stringify({ type: 'server-error', value: String(error) });
                    controller.enqueue(new TextEncoder().encode(errorChunk + '\n'));
                    controller.close();
                }
            }
        });

        console.log('[Chat API] Streaming started with custom NDJSON protocol');
        return new Response(stream, {
            headers: {
                'Content-Type': 'application/x-ndjson',
                'X-Content-Type-Options': 'nosniff'
            }
        });

    } catch (error: any) {
        console.error("❌ [Chat API] Critical Error:", error);
        return new Response(JSON.stringify({ error: "Internal Server Error", details: error.message }), { status: 500 });
    }
}
