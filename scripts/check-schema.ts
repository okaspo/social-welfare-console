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

async function checkSchema() {
    loadEnvFile(path.join(process.cwd(), '.env.local'));
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error("Missing keys");
        return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("Checking columns for 'system_prompts'...");

    // Using RPC or just selecting a row to see what we get if we can't access information_schema easily with anon key
    // But since we are dev, maybe we have service key in .env.local? The sync script used it.

    // Try information_schema first
    const { data: user_columns, error } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type')
        .eq('table_name', 'system_prompts')
        .eq('table_schema', 'public');

    if (error) {
        console.error("Error query info schema:", error);
    } else {
        console.log("Columns found:", user_columns);
    }
}

checkSchema();
