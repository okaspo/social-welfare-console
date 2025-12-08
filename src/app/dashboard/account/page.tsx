import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SettingsForm from './settings-form'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
    console.log('Rendering Settings Page')

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Fetch Profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, corporation_name')
        .eq('id', user.id)
        .single()

    const initialData = {
        fullName: profile?.full_name || '',
        corporationName: profile?.corporation_name || ''
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">設定</h1>
                <p className="text-gray-500 text-sm mt-1">
                    アカウント情報や法人設定の管理。
                </p>
            </div>

            <SettingsForm initialData={initialData} />
        </div>
    )
}
