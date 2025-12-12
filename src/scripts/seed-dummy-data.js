
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// 0. Load .env.local manually
try {
    const envPath = path.resolve(__dirname, '../../.env.local')
    if (fs.existsSync(envPath)) {
        console.log('Loading .env.local...')
        const envConfig = fs.readFileSync(envPath, 'utf8')
        envConfig.split('\n').forEach(line => {
            const parts = line.split('=')
            if (parts.length >= 2) {
                const key = parts[0].trim()
                const val = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '')
                if (key && !key.startsWith('#')) {
                    process.env[key] = val
                }
            }
        })
    } else {
        console.warn('No .env.local found at:', envPath)
    }
} catch (e) {
    console.warn('Failed to load .env.local', e)
}

// Service role key needed for admin user creation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing env vars: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    console.error('Current keys:', Object.keys(process.env).filter(k => k.includes('SUPABASE')))
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const PLANS = ['FREE', 'STANDARD', 'PRO', 'ENTERPRISE']

async function seedDummyUsers() {
    console.log('Seeding dummy users...')

    for (const plan of PLANS) {
        const email = `demo-${plan.toLowerCase()}@example.com`
        const password = 'password123'
        const name = `Demo User (${plan})`
        const corpName = `Social Welfare ${plan} Corp`

        console.log(`Processing ${email}...`)

        let userId

        // 1. Try to Create Auth User
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
                full_name: name,
                corporation_name: corpName,
                corporation_address: 'Tokyo, Japan',
                corporation_phone: '03-1234-5678',
                establishment_date: '2020-01-01'
            }
        })

        if (authError) {
            // If creation failed, try to find the user
            console.log(`  - Create info: ${authError.message}`)
            const { data: listData } = await supabase.auth.admin.listUsers()
            const existingUser = listData.users.find(u => u.email === email)

            if (existingUser) {
                console.log(`  - User exists. Updating data for ID: ${existingUser.id}`)
                userId = existingUser.id
            } else {
                console.error(`  - Failed to create and could not find user. Skipping.`)
                continue
            }
        } else {
            userId = authData.user.id
            console.log(`  - User created: ${userId}`)
        }

        // 2. Upsert Organization
        // We need to find if an org exists for this user? Or just create a new one?
        // Let's look for an org with this name, or just insert new one?
        // To keep it simple, let's just insert checking for conflict if possible, 
        // but organizations doesn't have a unique constraint on name usually.
        // Actually, let's just create a new one OR update if we can link it.
        // For a seed script, let's just create/update based on name?

        let orgId

        const { data: existingOrg } = await supabase
            .from('organizations')
            .select('id')
            .eq('name', corpName)
            .single()

        if (existingOrg) {
            console.log(`  - Org exists: ${existingOrg.id}. Updating plan...`)
            const { error: updateError } = await supabase
                .from('organizations')
                .update({ plan: plan })
                .eq('id', existingOrg.id)

            if (updateError) console.error('  - Org update error:', updateError)
            orgId = existingOrg.id
        } else {
            console.log(`  - Creating Org...`)
            const { data: newOrg, error: orgError } = await supabase
                .from('organizations')
                .insert({
                    name: corpName,
                    plan: plan
                })
                .select()
                .single()

            if (orgError) {
                console.error('  - Org create error:', orgError)
                continue
            }
            orgId = newOrg.id
        }

        // 3. Upsert Profile
        const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
                id: userId,
                full_name: name,
                corporation_name: corpName,
                organization_id: orgId
            })

        if (profileError) {
            console.error('  - Profile upsert error:', profileError)
        } else {
            console.log(`  - Success: ${email} linked to ${plan} plan.`)
        }
    }
}

seedDummyUsers()
