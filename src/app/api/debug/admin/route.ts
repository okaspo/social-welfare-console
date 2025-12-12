
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
    const supabase = await createAdminClient()

    // 1. Check Key
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceKey) {
        return NextResponse.json({ error: 'Missing SUPABASE_SERVICE_ROLE_KEY' }, { status: 500 })
    }

    // 2. Try Fetch
    const { data: users, error: userError } = await supabase.from('profiles').select('*').limit(5)

    const { data: orgs, error: orgError } = await supabase.from('organizations').select('*').limit(5)

    return NextResponse.json({
        keyStarts: serviceKey.substring(0, 5) + '...',
        userCount: users?.length,
        orgCount: orgs?.length,
        users: users,
        orgs: orgs,
        errors: {
            user: userError,
            org: orgError
        }
    })
}
