import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

export type AuditAction =
    | 'OFFICER_CREATE'
    | 'OFFICER_UPDATE'
    | 'OFFICER_DELETE'
    | 'MEETING_CREATE'
    | 'MEETING_UPDATE'
    | 'SUBSCRIPTION_CHANGE'
    | 'SYSTEM_SETTINGS_UPDATE'

export type AuditSeverity = 'INFO' | 'WARNING' | 'CRITICAL'

export async function logAudit(
    action: AuditAction,
    details: string,
    severity: AuditSeverity = 'INFO',
    metadata: Record<string, any> = {}
) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            console.warn('Audit log attempted without user context:', action)
            return
        }

        // Get organization_id from profiles
        const { data: profile } = await supabase
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .single()

        if (!profile?.organization_id) {
            console.warn('Audit log attempted without organization context:', action)
            return
        }

        // Get IP (best effort)
        const ip = (await headers()).get('x-forwarded-for') || 'unknown'

        const { error } = await supabase.from('audit_logs').insert({
            organization_id: profile.organization_id,
            actor_id: user.id,
            action,
            details,
            severity,
            metadata,
            ip_address: ip,
            created_at: new Date().toISOString()
        })

        if (error) {
            console.error('Failed to write audit log:', error)
        }
    } catch (e) {
        console.error('Audit log exception:', e)
    }
}
