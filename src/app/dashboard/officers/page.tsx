import OfficerList from "@/components/officers/officer-list"
import { createClient } from "@/lib/supabase/server"
import { MOCK_OFFICERS, Officer } from "@/lib/officers/data"

async function getOfficers(): Promise<Officer[]> {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    // Mock Mode Check
    if (!supabaseUrl || !supabaseKey) {
        return MOCK_OFFICERS
    }

    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) return MOCK_OFFICERS

        const { data: profile } = await supabase
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .single()

        if (!profile?.organization_id) return MOCK_OFFICERS

        const { data, error } = await supabase
            .from('officers')
            .select('*')
            .eq('organization_id', profile.organization_id)
            .order('created_at', { ascending: false })

        if (error || !data) {
            console.error('Error fetching officers:', error)
            return MOCK_OFFICERS // Fallback on error
        }

        // Map DB fields to Officer interface if necessary
        // Assuming DB matches schema closely but need to handle dates/keys
        return data.map(d => ({
            id: d.id,
            name: d.name,
            role: d.role,
            termStartDate: d.term_start || d.term_start_date, // Handle inconsistent naming if any
            termEndDate: d.term_end || d.term_end_date,
            status: 'active', // Simplified status logic, ideally calculated from dates
            expertise_tags: d.expertise_tags
        })) as Officer[]

    } catch (e) {
        return MOCK_OFFICERS
    }
}

// ... imports
import { checkSubscriptionStatus } from "@/lib/subscription"

// ... getOfficers function ...

export default async function OfficerManagementPage() {
    const officers = await getOfficers()
    const supabase = await createClient()

    // Check Subscription Status
    let readOnly = false
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .single()

        if (profile?.organization_id) {
            const { status } = await checkSubscriptionStatus(profile.organization_id)
            if (status === 'canceled') {
                readOnly = true
            }
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">役員・評議員管理</h1>
                <p className="text-gray-500 text-sm mt-1">
                    理事、監事、評議員、および選任解任委員の任期管理を行います。
                </p>
                {readOnly && (
                    <div className="mt-2 p-2 bg-yellow-50 text-yellow-800 text-sm rounded border border-yellow-200">
                        ※ 現在、Freeプラン（解約済）のため、新規登録・編集は制限されています。閲覧のみ可能です。
                    </div>
                )}
            </div>

            <OfficerList initialOfficers={officers} readOnly={readOnly} />
        </div>
    )
}
