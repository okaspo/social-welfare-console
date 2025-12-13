
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

async function fixActivePersona() {
    console.log('Fetching aoi_persona versions...');

    // 1. Get all versions
    const { data, error } = await supabase
        .from('system_prompts')
        .select('id, version, is_active, created_at, content')
        .eq('name', 'aoi_persona')
        .order('version', { ascending: false });

    if (error) {
        console.error('Error fetching prompts:', error);
        return;
    }

    if (!data || data.length === 0) {
        console.log('No aoi_persona records found!');
        return;
    }

    console.log(`Found ${data.length} versions.`);

    // The first one is the latest version due to sorting
    const latest = data[0];
    const others = data.slice(1);

    console.log(`Latest Version: v${latest.version} (ID: ${latest.id})`);
    console.log(`Current Status: ${latest.is_active ? 'ACTIVE' : 'INACTIVE'}`);
    console.log(`Content Preview: ${latest.content.substring(0, 50).replace(/\n/g, ' ')}...`);

    // 2. Activate Latest if not active
    if (!latest.is_active) {
        console.log('Activating latest version...');
        const { error: updateError } = await supabase
            .from('system_prompts')
            .update({ is_active: true })
            .eq('id', latest.id);

        if (updateError) console.error('Error activating latest:', updateError);
        else console.log('✅ Latest version activated.');
    } else {
        console.log('Latest version is already active.');
    }

    // 3. Deactivate others if any are active
    const activeOthers = others.filter(p => p.is_active);
    if (activeOthers.length > 0) {
        console.log(`Deactivating ${activeOthers.length} older versions...`);
        for (const p of activeOthers) {
            await supabase.from('system_prompts').update({ is_active: false }).eq('id', p.id);
            console.log(`- Deactivated v${p.version} (ID: ${p.id})`);
        }
    } else {
        console.log('No other active versions found.');
    }
}

fixActivePersona();
