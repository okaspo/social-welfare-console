// Usage Logging API
// Track feature usage for analytics and quota management

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
    try {
        const { feature, metadata = {} } = await req.json();

        if (!feature) {
            return NextResponse.json({ error: 'Feature required' }, { status: 400 });
        }

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .single();

        if (!profile?.organization_id) {
            return NextResponse.json(
                { error: 'Organization not found' },
                { status: 404 }
            );
        }

        const adminSupabase = createAdminClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Log usage
        await adminSupabase.from('usage_logs').insert({
            organization_id: profile.organization_id,
            user_id: user.id,
            feature_name: feature,
            metadata,
            usage_count: 1,
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Usage logging error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
