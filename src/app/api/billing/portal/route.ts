import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/client';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
    try {
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
            return NextResponse.json({ error: 'No organization found' }, { status: 400 });
        }

        const { data: org } = await supabase
            .from('organizations')
            .select('stripe_customer_id')
            .eq('id', profile.organization_id)
            .single();

        if (!org?.stripe_customer_id) {
            return NextResponse.json({ error: 'No billing account found' }, { status: 400 });
        }

        const session = await stripe.billingPortal.sessions.create({
            customer: org.stripe_customer_id,
            return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/swc/dashboard/settings`,
        });

        return NextResponse.json({ url: session.url });
    } catch (error: any) {
        console.error('Stripe Portal Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
