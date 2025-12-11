import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

function loadEnvFile(filePath: string) {
    if (fs.existsSync(filePath)) {
        console.log(`Loading env from ${filePath}`);
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

async function checkSystemPrompts() {
    loadEnvFile(path.join(process.cwd(), '.env'));
    loadEnvFile(path.join(process.cwd(), '.env.local'));

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error('Missing Supabase credentials');
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check system_prompts
    console.log('Checking system_prompts table...');
    const { data: prompts, error: promptError } = await supabase
        .from('system_prompts')
        .select('*');

    if (promptError) {
        console.error('Error fetching system_prompts:', promptError);
    } else {
        console.log(`Found ${prompts?.length || 0} system prompts:`);
        prompts?.forEach(p => {
            console.log(`- Name: "${p.name}", Content length: ${p.content?.length || 0}`);
            if (p.content) {
                console.log(`  First 200 chars: ${p.content.substring(0, 200)}...`);
            }
        });
    }

    // Check knowledge_items
    console.log('\nChecking knowledge_items table...');
    const { data: knowledge, error: knowledgeError } = await supabase
        .from('knowledge_items')
        .select('id, title, category, is_active, content')
        .eq('is_active', true);

    if (knowledgeError) {
        console.error('Error fetching knowledge_items:', knowledgeError);
    } else {
        console.log(`Found ${knowledge?.length || 0} active knowledge items:`);
        knowledge?.forEach(k => {
            console.log(`- [${k.category}] ${k.title} (Content: ${k.content?.length || 0} chars)`);
        });
    }
}

checkSystemPrompts().catch(console.error);
