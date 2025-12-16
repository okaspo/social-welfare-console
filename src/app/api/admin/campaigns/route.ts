import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
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

        const body = await request.json();
        const {
            code,
            description,
            discount_percent,
            target_plan_id,
            expires_at,
            max_uses
        } = body;

        // Use admin client for system operations
        const adminSupabase = createAdminClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // 1. Create entry in campaign_codes for validation logic
        const { data: campaign, error: campaignError } = await adminSupabase
            .from('campaign_codes')
            .insert({
                code,
                description,
                discount_percent,
                target_plan_id,
                expires_at: expires_at || null,
                max_uses: max_uses || null,
                created_by: user.id
            })
            .select()
            .single();

        if (campaignError) {
            console.error('Error creating campaign code:', campaignError);
            return NextResponse.json({ error: 'Failed to create campaign code' }, { status: 500 });
        }

        // 2. Calculate discounted amounts and create hidden prices in plan_prices
        // Get base price for target plan
        const { data: basePrices } = await adminSupabase
            .from('plan_prices')
            .select('*')
            .eq('plan_id', target_plan_id.toUpperCase())
            .eq('is_public', true);

        if (basePrices && basePrices.length > 0) {
            const discountMultiplier = (100 - discount_percent) / 100;

            const newPrices = basePrices.map(bp => ({
                plan_id: bp.plan_id,
                amount: Math.floor(bp.amount * discountMultiplier),
                currency: bp.currency,
                interval: bp.interval,
                is_public: false,
                campaign_code: code
            }));

            const { error: priceError } = await adminSupabase
                .from('plan_prices')
                .insert(newPrices);

            if (priceError) {
                console.error('Error creating linked prices:', priceError);
                // Note: Ideally we should rollback campaign_code here, but for simplicity we log it.
            }
        }

        // Audit log
        await adminSupabase.from('audit_logs').insert({
            user_id: user.id,
            action_type: 'campaign_created',
            table_name: 'campaign_codes',
            record_id: code,
            after_state: JSON.stringify(body)
        });

        return NextResponse.json({ success: true, campaign });

    } catch (error) {
        console.error('Error in POST /api/admin/campaigns:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
