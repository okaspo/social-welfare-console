
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Paths to artifacts (Local docs)
const DOCS_DIR = path.join(process.cwd(), 'docs');
const ARTIFACT_STRATEGY = path.join(DOCS_DIR, 'product_strategy.md');
const ARTIFACT_WALKTHROUGH = path.join(process.cwd(), '.gemini/antigravity/brain/889470bf-282a-4e4e-9f7d-59fdee0b4c1c/walkthrough.md'); // Keep using the brain artifact or migrate it too. For now let's point to the active walkthrough in brain if possible, or docs.
// Better practice: Copy active walkthrough to docs/walkthrough.md in a separate step or just point to it.
// Let's assume we want to sync the ACTIVE brain one.
// Actually, checking the file system earlier, walkthrough is in brain.
// Let's rely on the brain path for walkthrough for now, but fix strategy.
const BRAIN_DIR = 'C:\\Users\\qubo_\\.gemini\\antigravity\\brain\\889470bf-282a-4e4e-9f7d-59fdee0b4c1c';
// Update the BRAIN_DIR to the Current Conversation ID as well!


// Simple .env parser since we can't depend on dotenv being installed
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
                const value = match[2].trim().replace(/^["']|["']$/g, ''); // Remove quotes
                if (!process.env[key]) {
                    process.env[key] = value;
                }
            }
        });
    }
}

async function syncKnowledge() {
    loadEnvFile(path.join(process.cwd(), '.env'));
    loadEnvFile(path.join(process.cwd(), '.env.local'));

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl) console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL');
    if (!supabaseServiceKey) console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
        console.error('❌ Missing Supabase credentials in .env or .env.local');
        process.exit(1);
    }

    console.log(`🔌 Connecting to Supabase: ${supabaseUrl}`);
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Diagnostic: List tables
    const { data: tables, error: tableError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public');

    if (tables) {
        console.log('📊 Available tables in public schema:', tables.map(t => t.table_name).join(', '));
    } else {
        console.warn('⚠️ Could not list tables:', tableError?.message);
    }

    console.log('📖 Reading documentation artifacts...');

    let content = '';

    // 1. Product Strategy
    if (fs.existsSync(ARTIFACT_STRATEGY)) {
        content += fs.readFileSync(ARTIFACT_STRATEGY, 'utf8');
        content += '\n\n---\n\n';
    } else {
        console.warn(`⚠️ Strategy doc not found at ${ARTIFACT_STRATEGY}`);
    }

    // 2. Walkthrough (Features)
    if (fs.existsSync(ARTIFACT_WALKTHROUGH)) {
        content += fs.readFileSync(ARTIFACT_WALKTHROUGH, 'utf8');
    } else {
        console.warn(`⚠️ Walkthrough doc not found at ${ARTIFACT_WALKTHROUGH}`);
    }

    if (!content.trim()) {
        console.error('❌ No content to sync.');
        process.exit(1);
    }

    console.log('💾 Syncing to Supabase Knowledge Base...');

    const { error } = await supabase.from('knowledge_items').upsert({
        title: 'サービス仕様書 (自動連携)',
        content: content,
        category: 'service_guide',
        tags: ['auto-generated', 'system', 'specs'],
        is_active: true,
        updated_at: new Date().toISOString()
    }, { onConflict: 'title' }); // Assuming unique constraint on title or logic to find existing

    // Note: If 'title' is not a unique constraint, upsert might insert duplicate. 
    // Ideally we use a specific ID, but for now title-based matching is decent if we search first.
    // Let's refine to search first to be safe if no unique constraint on title.

    // Better Update Logic:
    const { data: existing } = await supabase.from('knowledge_items').select('id').eq('title', 'サービス仕様書 (自動連携)').single();

    if (existing) {
        const { error: updateError } = await supabase
            .from('knowledge_items')
            .update({
                content: content,
                updated_at: new Date().toISOString()
            })
            .eq('id', existing.id);

        if (updateError) throw updateError;
        console.log('✅ Updated existing knowledge item.');
    } else {
        const { error: insertError } = await supabase
            .from('knowledge_items')
            .insert({
                title: 'サービス仕様書 (自動連携)',
                content: content,
                category: 'service_guide',
                tags: ['auto-generated', 'system', 'specs'],
                is_active: true
            });

        if (insertError) throw insertError;
        console.log('✅ Created new knowledge item.');
    }

    console.log('🎉 Knowledge sync complete!');
}

syncKnowledge().catch(e => {
    console.error('❌ Sync failed:', e);
    process.exit(1);
});
