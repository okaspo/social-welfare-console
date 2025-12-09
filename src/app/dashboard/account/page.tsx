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
        .select(`
            full_name,
            corporation_name,
            organization:organizations (
                name,
                plan
            )
        `)
        .eq('id', user.id)
        .single()

    const initialData = {
        fullName: profile?.full_name || '',
        corporationName: profile?.corporation_name || '',
        // @ts-ignore
        plan: profile?.organization?.plan || 'FREE'
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div>
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">設定</h1>
                    {/* @ts-ignore */}
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        // @ts-ignore
                        initialData.plan === 'PRO' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                            // @ts-ignore
                            initialData.plan === 'STANDARD' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                // @ts-ignore
                                initialData.plan === 'ENTERPRISE' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                                    'bg-gray-100 text-gray-600 border-gray-200'
                        }`}>
                        {/* @ts-ignore */}
                        {initialData.plan}プラン
                    </span>
                </div>
                <p className="text-gray-500 text-sm mt-1">
                    アカウント情報や法人設定の管理。
                </p>
            </div>

            <SettingsForm initialData={initialData} />
        </div>
    )
}
