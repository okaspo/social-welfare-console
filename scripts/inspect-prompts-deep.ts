
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

async function inspectPrompts() {
    console.log('Inspecting system_prompts (Active ones)...');
    const { data, error } = await supabase
        .from('system_prompts')
        .select('*')
        .eq('is_active', true)
        .order('name');

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log(`Found ${data.length} active prompts.`);
    data.forEach(p => {
        console.log(`\n[Name: ${p.name}] (v${p.version})`);
        console.log(`  Content Preview:`);
        console.log(p.content);
        console.log('-------------------');
    });
}

inspectPrompts();
