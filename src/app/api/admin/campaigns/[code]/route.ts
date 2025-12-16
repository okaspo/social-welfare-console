import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export async function DELETE(
    request: NextRequest,
    { params }: { params: { code: string } }
) {
    try {
        const supabase = await createClient();

        // Verify admin authentication
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const code = params.code;

        // Use admin client
        const adminSupabase = createAdminClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // 1. Deactivate campaign code (soft delete or set active=false)
        // Here we choose to delete for simplicity to keep list clean, 
        // or set active=false. Let's delete to match the specific "delete" action.

        // First remove associated prices
        await adminSupabase
            .from('plan_prices')
            .delete()
            .eq('campaign_code', code);

        // Then remove campaign code metadata
        const { error } = await adminSupabase
            .from('campaign_codes')
            .delete()
            .eq('code', code);

        if (error) {
            console.error('Error deleting campaign:', error);
            return NextResponse.json({ error: 'Failed to delete campaign' }, { status: 500 });
        }

        // Audit log
        await adminSupabase.from('audit_logs').insert({
            user_id: user.id,
            action_type: 'campaign_deleted',
            table_name: 'campaign_codes',
            record_id: code,
            after_state: null
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error in DELETE /api/admin/campaigns/[code]:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
