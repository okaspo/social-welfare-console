import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
    const { plan } = await req.json()
    const supabase = await createClient()

    try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Unauthorized')

        // 1. Get user's org
        const { data: profile } = await supabase
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .single()

        if (!profile?.organization_id) throw new Error('No organization')

        // 2. Update Org Plan
        // Note: RLS might block this if not admin. 
        // Ideally this should be a service_role operation for billing updates.
        // For prototype, we assume the user is an owner/admin of the org and allowed to update, 
        // OR we use a privileged client here.

        // Using service role client (mocking strictly for prototype if regular client fails, but let's try regular first)
        // If regular RLS prevents org update, we need a secure way.
        // Let's assume for this "Mock Billing" we just allow it or use a proper backend function.

        const { error } = await supabase
            .from('organizations')
            .update({ plan: plan, updated_at: new Date().toISOString() })
            .eq('id', profile.organization_id)

        if (error) {
            // Fallback: If RLS blocks, log it (in real app we'd use admin client)
            console.error("Plan update failed (RLS?)", error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (e) {
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 })
    }
}
