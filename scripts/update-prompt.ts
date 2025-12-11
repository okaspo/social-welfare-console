import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

function loadEnvFile(filePath: string) {
    if (fs.existsSync(filePath)) {
        const envConfig = fs.readFileSync(filePath, 'utf8');
        envConfig.split('\n').forEach(line => {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) return;
            const match = trimmed.match(/^([^=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                const value = match[2].trim().replace(/^["']|["']$/g, '');
                if (!process.env[key]) process.env[key] = value;
            }
        });
    }
}

const UPDATED_PROMPT = `【役割定義】社会福祉法人専門 S級AI事務局 葵さん

あなたの役割
あなたは、社会福祉法人の制度に精通したS級AI事務局「葵」です。主な任務は、法令や行政手引きに基づき、法人の運営手続き（理事会・評議員会運営、入札・契約手続等）を支援し、法的に瑕疵のない文書を作成することです。
あなたは、法人のガバナンス強化のため、会計・経理の専門家（税理士・公認会計士）と緊密に連携し、計算書類等の承認プロセスが法的に適正に行われるよう、実務面から強くサポートします。

【行動原則とルール】
【知識ファイルの優先的参照】
法人に関する質問を受けた際は、まず共通知識ライブラリや知識ファイルの内容を確認し、それに基づいて回答・文書作成を行うこと。
知識に該当情報がない場合でも、一般的な社会福祉法人運営の知識に基づいて親切に回答してください。

ステップ0：初期モード選択
まず、ユーザーの目的を明確にするため、以下のどのモードで支援を行うかを確認してください。
【モード１：議事録・議案書の作成（通常開催）】
【モード２：開催スケジュールの提案】
【モード３：招集手続きの省略による会議開催】
【モード４：決議の省略（みなし決議）手続き】
【モード５：入札・契約手続きの支援】
【モード６：一般的な質問への回答】

ユーザーがモードを選択しない場合は、まず挨拶をして、どのようなお手伝いができるか尋ねてください。

【追加の応答ルール】
全ての応答の冒頭は必ず「葵です。」から始めてください。
ユーザーの質問に対して、できる限り親切に、わかりやすく回答してください。
`;

async function updateSystemPrompt() {
    loadEnvFile(path.join(process.cwd(), '.env.local'));

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error('Missing Supabase credentials');
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if default prompt exists
    const { data: existing } = await supabase
        .from('system_prompts')
        .select('id')
        .eq('name', 'default')
        .single();

    if (existing) {
        // Update existing
        const { error } = await supabase
            .from('system_prompts')
            .update({
                content: UPDATED_PROMPT,
                updated_at: new Date().toISOString()
            })
            .eq('id', existing.id);

        if (error) {
            console.error('Update error:', error);
            process.exit(1);
        }
        console.log('✅ Updated system prompt');
    } else {
        // Insert new
        const { error } = await supabase
            .from('system_prompts')
            .insert({
                name: 'default',
                content: UPDATED_PROMPT
            });

        if (error) {
            console.error('Insert error:', error);
            process.exit(1);
        }
        console.log('✅ Created new system prompt');
    }
}

updateSystemPrompt().catch(console.error);
