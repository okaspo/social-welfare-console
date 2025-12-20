/**
 * Database Migration Runner
 * Executes pending migrations using Supabase admin client
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';

// Load .env.local
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials');
    console.error('  NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
    console.error('  SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅ Set' : '❌ Missing');
    process.exit(1);
}

console.log('🔑 Credentials loaded successfully');
console.log(`📍 Supabase URL: ${supabaseUrl}`);

// Create admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false }
});

// Migrations to execute
const migrations = [
    '20251220_standardize_plan_features.sql',
    '20251220_campaign_features.sql',
    '20251220_phase1_core_tables.sql',
    '20251220_phase2_persona_entity.sql'
];

async function executeMigration(filename: string) {
    console.log(`\n📝 Executing: ${filename}`);

    const filePath = path.join(__dirname, '../supabase/migrations', filename);

    if (!fs.existsSync(filePath)) {
        console.error(`❌ File not found: ${filePath}`);
        return false;
    }

    let sql = fs.readFileSync(filePath, 'utf-8');

    // Remove BEGIN/COMMIT for single statement execution
    sql = sql.replace(/BEGIN;/gi, '').replace(/COMMIT;/gi, '');

    // Split into individual statements
    const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`  Found ${statements.length} SQL statements`);

    for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i];
        if (stmt.trim().length === 0) continue;

        try {
            // Use rpc to execute raw SQL
            const { error } = await supabase.rpc('exec_sql', {
                sql_query: stmt + ';'
            });

            if (error) {
                // Fallback: try direct REST API call
                const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': supabaseServiceKey,
                        'Authorization': `Bearer ${supabaseServiceKey}`,
                        'Prefer': 'return=minimal'
                    },
                    body: JSON.stringify({ sql_query: stmt + ';' })
                });

                if (!response.ok) {
                    const errText = await response.text();
                    console.log(`  ⚠️ Statement ${i + 1}: ${errText.slice(0, 100)}`);
                } else {
                    console.log(`  ✓ Statement ${i + 1} executed`);
                }
            } else {
                console.log(`  ✓ Statement ${i + 1} executed`);
            }
        } catch (e: any) {
            console.log(`  ⚠️ Statement ${i + 1}: ${e.message?.slice(0, 100)}`);
        }
    }

    return true;
}

async function verifyMigration1() {
    console.log('\n🔍 Verifying migration 1: Plan features');

    const { data, error } = await supabase
        .from('plan_limits')
        .select('plan_id, features')
        .order('plan_id');

    if (error) {
        console.log('  ⚠️ Could not verify plan_limits:', error.message);
        return;
    }

    console.log('  📊 Current plan features:');
    data?.forEach(plan => {
        const featureCount = plan.features ? Object.keys(plan.features).length : 0;
        console.log(`    ${plan.plan_id}: ${featureCount} features`);
    });
}

async function verifyMigration2() {
    console.log('\n🔍 Verifying migration 2: Campaign system');

    const { data, error } = await supabase
        .from('campaign_codes')
        .select('code, unlocked_features, target_plans')
        .limit(5);

    if (error) {
        console.log('  ⚠️ Campaign table check:', error.message);
        return;
    }

    console.log('  📊 Campaigns found:', data?.length || 0);
    data?.forEach(c => {
        console.log(`    ${c.code}: ${c.unlocked_features?.join(', ')} for ${c.target_plans?.join(', ')}`);
    });
}

async function main() {
    console.log('🚀 Database Migration Runner\n');

    for (const migration of migrations) {
        await executeMigration(migration);
    }

    console.log('\n\n✅ Migration process complete!');

    await verifyMigration1();
    await verifyMigration2();

    console.log('\n🎉 Done!');
}

main().catch(console.error);
