
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

// Updated Prompts
const UPDATED_DEFAULT = `
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
ユーザーとの対話に没入感を大切にしてください。
`.trim();

const UPDATED_PERSONA = `
【葵 (Aoi) のキャラクター設定】
・年齢: 28歳
・職業: フリーランスのS級・社会福祉法人専任事務局員
・性格:
  - クールで知的だが、内面には強い責任感と優しさを持つ。
  - 少し毒舌なところがあるが、それは相手を思うがゆえの厳しさ。
  - 「完璧な仕事」を信条としており、ミスや法令違反には厳しい。
  - しかし、困っている人を見捨てられない姉御肌な一面も。

【重要：没入感の徹底】
・絶対に「私はAIです」や「プログラムされた設定です」といった発言をしないこと。
・「葵です」という名乗りは最初の挨拶以外では不要。自然な会話の流れを重視すること。
・フィクションや設定の話（「物語上の設定」など）を絶対にしないこと。ユーザーにとってあなたは実在する事務局員として振る舞ってください。

・口調:
  - 基本的には丁寧語 (です・ます) だが、自信に満ちた断定的な言い回しが多い。
  - 例：「〜ですね。」「〜すべきです。」「言ったはずですよ？」「仕方ないですね、手伝います。」
・好きなもの:
  - 完璧に整理された書類、ブラックコーヒー、猫
・嫌いなもの:
  - 曖昧な指示、非効率な会議、法令遵守意識の低い理事
`.trim();

async function updatePrompts() {
    console.log('Updating prompts for immersion...');

    // Update Default
    const { error: err1 } = await supabase
        .from('system_prompts')
        .update({
            content: UPDATED_DEFAULT,
            version: 2,
            changelog: 'Remove "start with name" rule for immersion'
        })
        .eq('name', 'default');

    if (err1) console.error('Error updating default:', err1);
    else console.log('✅ Default prompt updated.');

    // Update Persona
    // We need to find the active persona ID first to update IT, or insert a new version?
    // Let's Insert a NEW version to be safe and activate it.

    // 1. Get current version number
    const { data: currentPersona } = await supabase
        .from('system_prompts')
        .select('version')
        .eq('name', 'aoi_persona')
        .order('version', { ascending: false })
        .limit(1)
        .single();

    const nextVersion = (currentPersona?.version || 0) + 1;

    // 2. Insert new version
    const { data: newPersona, error: err2 } = await supabase
        .from('system_prompts')
        .insert({
            name: 'aoi_persona',
            content: UPDATED_PERSONA,
            version: nextVersion,
            is_active: false, // Will activate next
            changelog: 'Refine immersion: remove meta-talk and repetitive naming',
            created_at: new Date().toISOString()
        })
        .select()
        .single();

    if (err2) {
        console.error('Error inserting new persona:', err2);
        return;
    }

    // 3. Activate new version
    console.log(`Activating new persona v${nextVersion}...`);
    await supabase.from('system_prompts').update({ is_active: false }).eq('name', 'aoi_persona');
    await supabase.from('system_prompts').update({ is_active: true }).eq('id', newPersona.id);

    console.log('✅ Aoi Persona updated and activated.');
}

updatePrompts();
