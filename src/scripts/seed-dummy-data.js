
const { createClient } = require('@supabase/supabase-js')

// Service role key needed for admin user creation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing env vars (SUPABASE_SERVICE_ROLE_KEY required)')
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

        console.log(`Creating ${email}...`)

        // 1. Create Auth User
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true
        })

        if (authError) {
            console.log(`User maybe exists: ${authError.message}`)
            // Try to fetch if exists to get ID? Or just skip
            continue
        }

        const userId = authData.user.id

        // 2. Create Organization
        const { data: orgData, error: orgError } = await supabase
            .from('organizations')
            .insert({
                name: corpName,
                plan: plan
            })
            .select()
            .single()

        if (orgError) {
            console.error('Org create error:', orgError)
            continue
        }

        const orgId = orgData.id

        // 3. Create Profile
        const { error: profileError } = await supabase
            .from('profiles')
            .insert({
                id: userId,
                full_name: name,
                corporation_name: corpName,
                organization_id: orgId
            })

        if (profileError) {
            console.error('Profile create error:', profileError)
        } else {
            console.log(`Success: ${email} -> Plan: ${plan}`)
        }
    }
}

seedDummyUsers()
