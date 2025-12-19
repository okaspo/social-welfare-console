import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Error: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing in .env.local')
    process.exit(1)
}

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
)

const USER_EMAIL = 'qubo.jun@gmail.com'
const USER_PASSWORD = 'Ainomimifuyu1914'

async function createAdminUser() {
    console.log(`Creating user: ${USER_EMAIL}...`)

    // 1. Create or Get User
    // We try to create first. If it fails with "User already registered", we fetch by email (using listUsers or just proceeding to update role).
    // admin.createUser with email_confirm: true automatically verifies.

    const { data: { user }, error: createError } = await supabase.auth.admin.createUser({
        email: USER_EMAIL,
        password: USER_PASSWORD,
        email_confirm: true
    })

    let targetUser = user

    if (createError) {
        // If user already exists, we should try to get their ID to update the role.
        console.log('User creation returned:', createError.message)

        // Unfortunately searching by email in admin api is not a direct single call, 
        // we have to use listUsers or just assume UUID if we had it. 
        // But listUsers is good.
        const { data: usersData, error: listError } = await supabase.auth.admin.listUsers()

        if (listError) {
            console.error('Failed to list users:', listError)
            process.exit(1)
        }

        const foundUser = usersData.users.find(u => u.email === USER_EMAIL)

        if (foundUser) {
            console.log('Found existing user ID:', foundUser.id)
            targetUser = foundUser
        } else {
            console.error('Could not create user and could not find existing user.')
            process.exit(1)
        }
    } else {
        console.log('User created successfully:', targetUser!.id)
    }

    if (!targetUser) {
        console.error('No target user found.')
        process.exit(1)
    }

    // 2. Grant super_admin role
    console.log(`Granting super_admin role to user ${targetUser.id}...`)

    const { error: upsertError } = await supabase
        .from('admin_roles')
        .upsert({
            user_id: targetUser.id,
            role: 'super_admin'
        }, { onConflict: 'user_id' })

    if (upsertError) {
        console.error('Failed to grant role:', upsertError)
        process.exit(1)
    }

    console.log('Super Admin created successfully')
}

createAdminUser()
