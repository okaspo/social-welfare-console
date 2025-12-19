import { createClient } from '@/lib/supabase/server'
import ProfileSettingsForm from './profile-form'

export default async function ProfileSettingsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return <div>Unauthorized</div>
    }

    // Fetch current profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, job_title, age_group, gender')
        .eq('id', user.id)
        .single()

    return <ProfileSettingsForm profile={profile} />
}
