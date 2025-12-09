import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SettingsForm from './settings-form'
import { AccountHeader } from './account-header'

export default async function AccountPage() {
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
            <AccountHeader plan={initialData.plan} />
            <SettingsForm initialData={initialData} />
        </div>
    )
}
