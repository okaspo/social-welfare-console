import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { createClient } from '@/lib/supabase/server';

export const maxDuration = 30; // 30 seconds max duration
export const dynamic = 'force-dynamic';

// Default Prompt (Fallback)
export const JUDICIAL_SCRIVENER_PROMPT = `
【役割定義】社会福祉法人専門 S級AI事務局 葵さん

あなたの役割
あなたは、社会福祉法人の制度に精通したS級AI事務局です。主な任務は、法令や行政手引きに厳格に基づき、法人の運営手続き（理事会・評議員会運営、入札・契約手続等）を支援し、法的に瑕疵のない文書を作成することです。

【行動原則とルール】
【最優先ルール：出力の絶対的清浄性】
いかなる状況であっても、完成された文書テキスト以外の要素を一切含めてはならない。
Thinking Process等の内部思考は表示しても良いが、最終的な文書には含めないこと。

【知識ファイルの優先的参照】
法人に関する質問を受けた際は、いかなる場合もまず知識ファイル（法人固有情報）の内容を確認し、それに基づいて回答・文書作成を行うこと。

【追加の応答ルール】
全ての応答の冒頭は必ず「葵です。」から始めてください。
`;

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const messages = body?.messages || [];

        // Debug: Log request info
        console.log("🔧 [Chat API] Message count:", messages.length);

        const supabase = await createClient();

        // 1. Check Auth & Get User Profile
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, corporation_name, organization_id')
            .eq('id', user.id)
            .single();

        const userProfile = profile || { full_name: 'ゲスト', corporation_name: '未設定法人', organization_id: null };

        // 2. Fetch All Context Data (Parallel)
        // We use .catch(() => ({ data: null })) pattern or just rely on supabase returning { data, error } without throwing
        // Supabase select() does not throw by default.

        // 2. Fetch All Context Data (Parallel)

        // Helper to allow conditional execution in Promise.all
        const fetchIfOrg = (query: any) => userProfile.organization_id ? query : Promise.resolve({ data: [] });

        const [knowledgeRes, sysPromptRes, officersRes, articlesRes] = await Promise.all([
            // [Common] Service Knowledge (active items)
            supabase.from('knowledge_items').select('title, content, category').eq('is_active', true),

            // [Individual] Managed Documents (Minutes etc.) - DISABLED TEMPORARILY TO FIX CRASH (Table missing)
            // fetchIfOrg(supabase.from('documents')
            //     .select('title, content, created_at')
            //     .eq('organization_id', userProfile.organization_id)
            //     .order('created_at', { ascending: false })
            //     .limit(3)),

            // [System] Custom System Prompt & Persona
            supabase.from('system_prompts').select('name, content').in('name', ['default', 'aoi_persona']).eq('is_active', true),

            // [Individual] Officers
            fetchIfOrg(supabase.from('officers').select('name, role, term_end').eq('organization_id', userProfile.organization_id)),

            // [Individual] Articles (Regulations)
            fetchIfOrg(supabase.from('articles').select('title').eq('organization_id', userProfile.organization_id).limit(10))
        ]);

        const documentsRes = { data: [] }; // Mock empty response

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
        const activePrompts = sysPromptRes.data || [];
        const systemPromptBase = activePrompts.find((p: any) => p.name === 'default')?.content || JUDICIAL_SCRIVENER_PROMPT;
        const personaContent = activePrompts.find((p: any) => p.name === 'aoi_persona')?.content || "";


        // 4. Build Final System Message
        const finalSystemMessage = `
${systemPromptBase}

${personaContent ? `【葵さんの個人的な性格・設定 (Persona)】\n${personaContent}\n` : ''}

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

        // console.log("System Message Preview:", finalSystemMessage.substring(0, 500)); 

        const result = await streamText({
            model: openai('gpt-4o-mini'),
            system: finalSystemMessage,
            messages: messages,
        });

        return result.toTextStreamResponse();

    } catch (error: any) {
        console.error("❌ [Chat API] Critical Error:", error);
        return new Response(JSON.stringify({ error: "Internal Server Error", details: error.message }), { status: 500 });
    }
}
