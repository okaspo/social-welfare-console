import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Settings, Shield, Bell, CreditCard } from 'lucide-react'
import PlanSettings from '@/components/organization/plan-settings'
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

            {/* Notification & Security Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <NotificationSettings />
                <SecuritySettings />
            </div>

            {/* Plan Settings */}
            <PlanSettings currentPlan={currentPlan} />
        </div>
    )
}
