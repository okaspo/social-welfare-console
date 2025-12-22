
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
    console.error('Error: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing in .env.local')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function main() {
    const args = process.argv.slice(2)
    const command = args[0]

    if (command === 'list' || !command) {
        await listUsers()
    } else if (command === 'update') {
        const email = args[1]
        const role = args[2]
        if (!email || !role) {
            console.error('Usage: update <email> <role>')
            process.exit(1)
        }
        await updateUserRole(email, role)
    } else if (command === 'promote-latest') {
        await promoteLatestUser()
    } else {
        console.log('Usage:')
        console.log('  npm run manage-admin list           # List recent users')
        console.log('  npm run manage-admin update <email> <role>  # Update user role')
        console.log('  npm run manage-admin promote-latest    # Promote the most recent user to super_admin')
    }
}

async function promoteLatestUser() {
    console.log('Fetching latest user...')
    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)

    if (error || !profiles || profiles.length === 0) {
        console.error('Error fetching latest user:', error)
        return
    }

    const user = profiles[0]
    console.log(`Promoting user ${user.full_name || user.id} to super_admin...`)
    await updateProfile(user.id, 'super_admin')
}

async function listUsers() {
    console.log('Fetching recent users...')

    // Fetch profiles joined with auth.users is hard via API, so we fetch profiles and match manually 
    // or just fetch profiles since they have email (if we synced it).
    // Wait, profiles table has email? Let's check schema. Usually profiles has user_id and maybe email.

    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)

    if (error) {
        console.error('Error fetching profiles:', error)
        return
    }

    console.log(JSON.stringify(profiles?.map(p => ({
        id: p.id,
        full_name: p.full_name,
        role: p.role,
        created: p.created_at
    })), null, 2))
}

async function updateUserRole(email: string, role: string) {
    // First find user id by email from auth.users (admin api) or profiles if email is there
    // Using Admin API to search user by email
    const { data: { users }, error: searchError } = await supabase.auth.admin.listUsers()

    if (searchError) {
        console.error('Error searching users:', searchError)
        return
    }

    const user = users.find(u => u.email === email)

    if (!user) {
        console.error(`User with email ${email} not found.`)
        // Fallback: try to find in profiles if email is stored there
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('email', email) // Assuming email column exists
            .single()

        if (profile) {
            console.log(`Found profile for ${email}, updating...`)
            await updateProfile(profile.id, role)
            return
        }
        return
    }

    console.log(`Found user ${user.email} (${user.id}). Updating role to '${role}'...`)
    await updateProfile(user.id, role)
}

async function updateProfile(userId: string, role: string) {
    const { error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', userId)

    if (error) {
        console.error('Error updating profile:', error)
    } else {
        console.log('Successfully updated role.')

        // Also update admin_roles table if it's strict
        if (role === 'admin' || role === 'super_admin' || role === 'representative') {
            // Upsert into admin_roles
            const { error: adminError } = await supabase
                .from('admin_roles')
                .upsert({ user_id: userId, role: role })

            if (adminError) {
                console.error('Error updating admin_roles table:', adminError)
            } else {
                console.log('Successfully synced to admin_roles table.')
            }
        }
    }
}

main()
