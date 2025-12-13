
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

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

loadEnvFile(path.join(process.cwd(), '.env'));
loadEnvFile(path.join(process.cwd(), '.env.local'));

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const JUDICIAL_SCRIVENER_PROMPT = `
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
`.trim();

async function seedDefaultPrompt() {
    console.log('Seeding default system prompt (replacing hardcoded fallback)...');

    // Check if it already exists
    const { data: existing } = await supabase
        .from('system_prompts')
        .select('*')
        .eq('name', 'default')
        .single();

    if (existing) {
        console.log('Default prompt already exists. Skipping or updating if needed.');
        // If the user wants to force migration, we should probably update it if it's currently inactive?
        // But let's assuming if it exists, it's what they want.
        // Wait, earlier check said 0 prompts. So likely not there.
    } else {
        const { error } = await supabase.from('system_prompts').insert([
            {
                name: 'default',
                content: JUDICIAL_SCRIVENER_PROMPT,
                is_active: true,
                version: 1,
                changelog: 'Initial migration from source code',
                created_at: new Date().toISOString()
            }
        ]);

        if (error) {
            console.error('Error seeding default prompt:', error);
        } else {
            console.log('✅ Default prompt seeded successfully.');
        }
    }
}

seedDefaultPrompt();
