import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { requireSystemAdmin } from '@/lib/auth/admin-auth';

export async function GET(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role using strict system admin check
    try {
        await requireSystemAdmin();
    } catch {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get format from query
    const format = request.nextUrl.searchParams.get('format') || 'csv';

    // Fetch all audit logs
    const { data: logs, error } = await supabase
        .from('audit_logs')
        .select(`
            *,
            actor:profiles!audit_logs_actor_id_fkey (
                full_name
            )
        `)
        .order('created_at', { ascending: false });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (format === 'json') {
        return NextResponse.json(logs, {
            headers: {
                'Content-Disposition': `attachment; filename=audit_logs_${new Date().toISOString().split('T')[0]}.json`
            }
        });
    }

    // CSV format
    const headers = ['日時', 'アクション', 'ユーザー', '対象リソース', '対象ID', 'IPアドレス', 'ユーザーエージェント'];
    const rows = logs?.map(log => [
        new Date(log.created_at).toISOString(),
        log.action,
        (log.actor as { full_name?: string })?.full_name || log.actor_id,
        log.target_resource,
        log.target_id || '',
        log.ip_address || '',
        log.user_agent || ''
    ]) || [];

    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    return new NextResponse('\uFEFF' + csvContent, {
        headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename=audit_logs_${new Date().toISOString().split('T')[0]}.csv`
        }
    });
}
