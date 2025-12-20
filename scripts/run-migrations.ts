/**
 * Database Migration Runner
 * Executes pending migrations using Supabase admin client
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Migrations to execute
const migrations = [
    '20251220_standardize_plan_features.sql',
    '20251220_campaign_features.sql'
];

async function executeMigration(filename: string) {
    console.log(`\n📝 Executing: ${filename}`);

    const filePath = path.join(__dirname, '../supabase/migrations', filename);

    if (!fs.existsSync(filePath)) {
        console.error(`❌ File not found: ${filePath}`);
        return false;
    }

    const sql = fs.readFileSync(filePath, 'utf-8');

    try {
        // Execute the migration
        const { data, error } = await supabase.rpc('exec_sql', { sql_string: sql });

        if (error) {
            // Try direct execution if RPC fails
            console.log('  Trying direct execution...');
            const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': supabaseServiceKey,
                    'Authorization': `Bearer ${supabaseServiceKey}`
                },
                body: JSON.stringify({ sql_string: sql })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${await response.text()}`);
            }

            console.log('✅ Migration executed successfully');
            return true;
        }

        console.log('✅ Migration executed successfully');
        return true;
    } catch (error: any) {
        console.error(`❌ Error executing migration: ${error.message}`);
        return false;
    }
}

async function verifyMigration1() {
    console.log('\n🔍 Verifying migration 1: Plan features standardization');

    const { data, error } = await supabase
        .from('plan_limits')
        .select('plan_id, features')
        .order('plan_id');

    if (error) {
        console.error('❌ Verification failed:', error.message);
        return;
    }

    console.log('\n📊 Current plan features:');
    data?.forEach(plan => {
        console.log(`  ${plan.plan_id}:`, plan.features);
    });
}

async function verifyMigration2() {
    console.log('\n🔍 Verifying migration 2: Campaign system');

    // Check tables exist
    const { data: campaigns, error: campaignError } = await supabase
        .from('campaign_codes')
        .select('code, unlocked_features, target_plans')
        .limit(5);

    if (campaignError) {
        console.error('❌ Campaign table verification failed:', campaignError.message);
        return;
    }

    console.log('\n📊 Sample campaigns:');
    campaigns?.forEach(campaign => {
        console.log(`  ${campaign.code}: ${campaign.unlocked_features?.join(', ')} for ${campaign.target_plans?.join(', ')}`);
    });
}

async function main() {
    console.log('🚀 Database Migration Runner\n');
    console.log(`📍 Supabase URL: ${supabaseUrl}`);
    console.log(`📁 Migrations directory: ${path.join(__dirname, '../supabase/migrations')}\n`);

    let allSuccess = true;

    for (const migration of migrations) {
        const success = await executeMigration(migration);
        if (!success) {
            allSuccess = false;
            console.warn(`⚠️  Skipping remaining migrations due to error`);
            break;
        }
    }

    if (allSuccess) {
        console.log('\n\n✅ All migrations executed successfully!\n');

        // Verify migrations
        await verifyMigration1();
        await verifyMigration2();

        console.log('\n\n🎉 Migration process complete!');
        console.log('\nNext steps:');
        console.log('  1. Verify in Supabase Dashboard: https://supabase.com/dashboard');
        console.log('  2. Check /admin/features page');
        console.log('  3. Check /admin/campaigns page');
    } else {
        console.log('\n\n❌ Migration process failed. Please check errors above.');
        process.exit(1);
    }
}

main().catch(console.error);
