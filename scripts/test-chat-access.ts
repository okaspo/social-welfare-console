
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

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

async function testChatAccess() {
    loadEnvFile(path.join(process.cwd(), '.env.local'));

    console.log("Testing access with ANON key (mimicking Chat API)...");

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error("Missing keys");
        return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Test System Prompt Access
    console.log("1. Testing 'system_prompts' access...");
    const { data: promptData, error: promptError } = await supabase
        .from('system_prompts')
        .select('content')
        .limit(1);

    if (promptError) {
        console.error("❌ Error fetching system_prompts:", promptError.message);
    } else {
        console.log("✅ Success fetching system_prompts");
    }

    // 2. Test Knowledge Items Access
    console.log("2. Testing 'knowledge_items' access...");
    const { data: knowledgeData, error } = await supabase
        .from('knowledge_items')
        .select('title, content, category')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(20);

    if (error) {
        console.error("❌ Error fetching knowledge:", error);
    } else {
        console.log(`✅ Success! Fetched ${knowledgeData.length} items.`);
        knowledgeData.forEach(item => {
            console.log(`- [${item.category}] ${item.title} (Content length: ${item.content.length})`);
        });
    }
}

testChatAccess();
