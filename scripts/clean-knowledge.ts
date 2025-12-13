
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

async function cleanKnowledge() {
    // 1. Get all items
    const { data, error } = await supabase
        .from('knowledge_items')
        .select('*');

    if (error) {
        console.error('Fetch error:', error);
        return;
    }

    console.log(`Found ${data.length} items.`);

    // 2. Filter for potential duplicates or old entries
    // Strategy: We only want ONE "Service Guide" type item.
    // If there are multiple items with title "サービス仕様書 (自動連携)", keep the latest one or merge them?
    // Actually, sync-knowledge.ts upserts based on title, so there should be only one with THAT exact title.
    // But maybe there are others with SIMILAR titles?

    const targetTitle = 'サービス仕様書 (自動連携)';
    const duplicates = data.filter(d => d.title === targetTitle);

    if (duplicates.length > 1) {
        console.log(`Found ${duplicates.length} duplicates for ${targetTitle}. Cleaning up...`);
        // Sort by updated_at desc
        duplicates.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

        // Keep the first one (latest), delete the rest
        const toDelete = duplicates.slice(1);
        for (const item of toDelete) {
            console.log(`Deleting duplicate ID: ${item.id}`);
            await supabase.from('knowledge_items').delete().eq('id', item.id);
        }
    } else {
        console.log('No duplicates found for the main service guide.');
    }

    // 3. Check for any OTHER items that might be from old logic
    console.log('Current items:');
    data.forEach(d => console.log(`- [${d.id}] ${d.title} (${d.category})`));
}

cleanKnowledge();
