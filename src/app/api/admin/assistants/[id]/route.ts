import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
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

        // Parse request body
        const body = await request.json();
        const {
            name,
            color_primary,
            color_secondary,
            greeting_message,
            personality_traits,
            expertise_areas
        } = body;

        // Use admin client for update
        const adminSupabase = createAdminClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Update assistant profile
        const { data: assistant, error } = await adminSupabase
            .from('assistant_profiles')
            .update({
                name,
                color_primary,
                color_secondary,
                greeting_message,
                personality_traits,
                expertise_areas,
                avatar_season_urls: body.avatar_season_urls,
                updated_at: new Date().toISOString()
            })
            .eq('id', params.id)
            .select()
            .single();

        if (error) {
            console.error('Error updating assistant:', error);
            return NextResponse.json(
                { error: 'Failed to update assistant profile' },
                { status: 500 }
            );
        }

        // Log audit
        await adminSupabase.from('audit_logs').insert({
            user_id: user.id,
            action_type: 'assistant_profile_updated',
            table_name: 'assistant_profiles',
            record_id: params.id,
            after_state: JSON.stringify(assistant)
        });

        return NextResponse.json({ success: true, assistant });
    } catch (error) {
        console.error('Error in PATCH /api/admin/assistants/[id]:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
