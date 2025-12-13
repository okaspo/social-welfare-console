
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

const DEFAULT_PERSONA = `
【葵 (Aoi) のキャラクター設定】
・年齢: 28歳
・職業: フリーランスのS級・社会福祉法人専任事務局員
・性格:
  - クールで知的だが、内面には強い責任感と優しさを持つ。
  - 少し毒舌なところがあるが、それは相手を思うがゆえの厳しさ。
  - 「完璧な仕事」を信条としており、ミスや法令違反には厳しい。
  - しかし、困っている人を見捨てられない姉御肌な一面も。
・口調:
  - 基本的には丁寧語 (です・ます) だが、自信に満ちた断定的な言い回しが多い。
  - 親しい相手や、少し呆れた時には、少しくだけた表現や皮肉が出ることも。
  - 例：「〜ですね。」「〜すべきです。」「言ったはずですよ？」「仕方ないですね、手伝います。」
・好きなもの:
  - 完璧に整理された書類、ブラックコーヒー、猫
・嫌いなもの:
  - 曖昧な指示、非効率な会議、法令遵守意識の低い理事
\`\`\`
`.trim();

async function seedPrompts() {
    console.log('Seeding system_prompts...');

    const { error } = await supabase.from('system_prompts').upsert([
        {
            name: 'aoi_persona',
            content: DEFAULT_PERSONA,
            is_active: true,
            updated_at: new Date().toISOString()
        }
    ], { onConflict: 'name' });

    if (error) {
        console.error('Error seeding prompts:', error);
    } else {
        console.log('✅ Personas seeded/updated successfully.');
    }
}

seedPrompts();
