// scripts/check-env.ts
// Simple script to verify that all required environment variables are set for the Vercel deployment.
import * as fs from 'fs';
import * as path from 'path';

// Simple .env parser manually implemented because ts-node doesn't load .env automatically
function loadEnv(filePath: string) {
    if (!fs.existsSync(filePath)) return;
    console.log(`Loading env from ${filePath}`);
    const content = fs.readFileSync(filePath, 'utf8');
    content.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return;
        const match = trimmed.match(/^([^=]+)=(.*)$/);
        if (match) {
            const key = match[1].trim();
            const value = match[2].trim().replace(/^["']|["']$/g, '');
            if (!process.env[key]) {
                process.env[key] = value;
            }
        }
    });
}

// Load env files
loadEnv(path.join(process.cwd(), '.env'));
loadEnv(path.join(process.cwd(), '.env.local'));

const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'OPENAI_API_KEY',
];

let missing = [];
for (const key of required) {
    if (!process.env[key]) {
        missing.push(key);
    }
}

if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing.join(', '));
    process.exit(1);
} else {
    console.log('✅ All required environment variables are set.');
}
