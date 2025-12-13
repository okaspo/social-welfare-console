import MinutesForm from "@/components/documents/minutes-form"
import { createClient } from "@/lib/supabase/server"

export default async function NewDocumentPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    let corporationName = "〇〇会"

    if (user) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('corporation_name')
            .eq('id', user.id)
            .single()

        if (profile?.corporation_name) {
            corporationName = profile.corporation_name
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">議案書の作成</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        理事会または評議員会の議事録を作成します。
                    </p>
                </div>
            </div>

            <MinutesForm initialCorporationName={corporationName} />
        </div>
    )
}
