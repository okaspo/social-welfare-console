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
                    // @ts-ignore
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
                }),
                show_officer_list: tool({
                    description: 'ユーザーが役員名簿を見たい時に呼び出す。右側のキャンバスに役員一覧を表示する。例: 「役員を見せて」「理事の一覧」「役員名簿」',
                    parameters: z.object({}),
                    // @ts-ignore
                    execute: async () => {
                        const { showOfficerList } = await import('@/lib/ai/canvas-tools');
                        const result = await showOfficerList();
                        return JSON.stringify({
                            type: 'canvas_action',
                            action: 'show_officer_list',
                            ...result
                        });
                    }
                }),
                draft_minutes: tool({
                    description: '議事録を作成したい時に呼び出す。右側のキャンバスに議事録エディタを表示する。例: 「議事録を作成」「理事会の議事録」「評議員会の記録」',
                    parameters: z.object({
                        meeting_type: z.enum(['board_meeting', 'council_meeting', 'general_meeting', 'committee']).optional().describe('会議の種類: 理事会(board_meeting), 評議員会(council_meeting), 総会(general_meeting), 委員会(committee)')
                    }),
                    // @ts-ignore
                    execute: async ({ meeting_type }: { meeting_type?: string }) => {
                        const { draftMinutes } = await import('@/lib/ai/canvas-tools');
                        const result = await draftMinutes(meeting_type);
                        return JSON.stringify({
                            type: 'canvas_action',
                            action: 'draft_minutes',
                            ...result
                        });
                    }
                }),
                clear_canvas: tool({
                    description: 'ユーザーが話題を切り替えた時、または作業を終了した時に呼び出す。現在のキャンバスの内容を下書きとして保存し、キャンバスをクリアする。',
                    parameters: z.object({
                        reason: z.string().optional().describe('キャンバスをクリアする理由（ユーザーへの説明用）')
                    }),
                    // @ts-ignore
                    execute: async ({ reason }: { reason?: string }) => {
                        const { clearCanvas } = await import('@/lib/ai/canvas-tools');
                        const result = await clearCanvas(null, reason);
                        return JSON.stringify({
                            type: 'canvas_action',
                            action: 'clear_canvas',
                            ...result
                        });
                    }
                }),
                update_canvas_field: tool({
                    description: 'キャンバスの特定フィールドを更新する。ユーザーとの対話から情報を抽出し、議事録などのフォームに自動入力する。例: 日付、出席者、議題などをセット。',
                    parameters: z.object({
                        field: z.enum(['date', 'meeting_type', 'attendees', 'agenda', 'content', 'corporation_name', 'title']).describe('更新するフィールド'),
                        value: z.any().describe('設定する値'),
                        action: z.enum(['set', 'append']).optional().describe('set=上書き、append=追加（配列フィールド用）')
                    }),
                    // @ts-ignore
                    execute: async ({ field, value, action }: { field: string, value: any, action?: string }) => {
                        const { updateCanvasField } = await import('@/lib/ai/canvas-updater');
                        const result = await updateCanvasField(field as any, value, (action as any) || 'set');
                        return JSON.stringify({
                            type: 'canvas_update',
                            action: 'update_field',
                            field,
                            value,
                            ...result
                        });
                    }
                }),
                collect_info_for_minutes: tool({
                    description: '議事録作成に必要な情報をユーザーから収集する際に使用。まだ収集していない情報を確認し、次に聞くべき質問を決定する。',
                    parameters: z.object({
                        collected: z.object({
                            date: z.boolean().optional(),
                            meeting_type: z.boolean().optional(),
                            attendees: z.boolean().optional(),
                            agenda: z.boolean().optional()
                        }).describe('既に収集した情報のフラグ')
                    }),
                    // @ts-ignore
                    execute: async ({ collected }: { collected: Record<string, boolean> }) => {
                        // 未収集の情報を特定
                        const missing: string[] = [];
                        if (!collected.date) missing.push('date');
                        if (!collected.meeting_type) missing.push('meeting_type');
                        if (!collected.attendees) missing.push('attendees');
                        if (!collected.agenda) missing.push('agenda');

                        // 次に聞くべき質問を決定
                        const questions: Record<string, string> = {
                            date: 'いつの会議ですか？（例: 今日、12月21日）',
                            meeting_type: 'どのような会議ですか？（例: 理事会、評議員会）',
                            attendees: '出席者を教えてください。',
                            agenda: '議題は何でしたか？'
                        };

                        const nextQuestion = missing.length > 0 ? questions[missing[0]] : null;

                        return JSON.stringify({
                            type: 'info_collection',
                            missing_fields: missing,
                            next_question: nextQuestion,
                            all_collected: missing.length === 0
                        });
                    }
                })
            },
            onFinish: async (completion) => {
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
