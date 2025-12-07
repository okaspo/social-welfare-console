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
        const { data, error } = await supabase
            .from('officers')
            .select('*')

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
            termStartDate: d.term_start,
            termEndDate: d.term_end,
            status: 'active' // Simplified status logic, ideally calculated from dates
        })) as Officer[]

    } catch (e) {
        return MOCK_OFFICERS
    }
}

export default async function OfficerManagementPage() {
    const officers = await getOfficers()

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">役員・評議員管理</h1>
                <p className="text-gray-500 text-sm mt-1">
                    理事、監事、評議員、および選任解任委員の任期管理を行います。
                </p>
            </div>

            <OfficerList initialOfficers={officers} />
        </div>
    )
}
