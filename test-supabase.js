
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load .env.local manually
try {
    const envConfig = dotenv.parse(fs.readFileSync(path.resolve(__dirname, '.env.local')));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
} catch (e) {
    console.error('Error loading .env.local', e);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Testing Supabase Connection...');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseKey ? 'Provided' : 'Missing');

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
    try {
        const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });
        if (error) {
            console.error('Supabase Error:', error);
        } else {
            console.log('Connection Successful! Data:', data);
        }
    } catch (err) {
        console.error('Network/Unexpected Error:', err);
    }
}

testConnection();
