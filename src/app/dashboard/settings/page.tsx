import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Settings, Shield, Bell, CreditCard } from 'lucide-react'
import SecuritySettings from '@/components/organization/security-settings'
import NotificationSettings from '@/components/organization/notification-settings'

export default async function SettingsPage() {
    const supabase = await createClient()

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
        redirect('/login')
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select(`
            organization:organizations (
                plan
            )
        `)
        .eq('id', user.id)
        .single()

    const org = Array.isArray(profile?.organization) ? profile?.organization[0] : profile?.organization
    const currentPlan = org?.plan || 'FREE'

    return (
        <div className="max-w-5xl mx-auto space-y-8 p-6 pb-20">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Settings className="h-6 w-6 text-gray-600" />
                    設定
                </h1>
                <p className="text-sm text-gray-500 mt-1">各種設定やプランの変更を行います。</p>
            </div>

            {/* Profile Settings Link */}
            <div className="bg-white border rounded-xl p-6 flex items-center justify-between shadow-sm">
                <div>
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <Settings className="h-5 w-5 text-gray-500" />
                        プロフィール設定
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        葵さんの接し方を最適化するため、あなたの情報を設定できます
                    </p>
                </div>
                <a
                    href="/dashboard/settings/profile"
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 bg-slate-900 text-white"
                >
                    プロフィール編集
                </a>
            </div>

            {/* Notification & Security Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <NotificationSettings />
                <SecuritySettings />
            </div>

            {/* Plan Settings Link */}
            <div className="bg-white border rounded-xl p-6 flex items-center justify-between shadow-sm">
                <div>
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-gray-500" />
                        プランと支払い
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        現在のプラン: <span className="font-bold text-indigo-600">{currentPlan}</span>
                    </p>
                </div>
                <a
                    href="/dashboard/settings/billing"
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 bg-slate-900 text-white"
                >
                    プラン変更・確認
                </a>
            </div>
        </div>
    )
}
