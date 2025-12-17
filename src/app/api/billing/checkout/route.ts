import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/client';
import { createClient } from '@/lib/supabase/server';
import { BILLING_CONFIG } from '@/config/billing';

export async function POST(req: NextRequest) {
    try {
        const { planId, interval } = await req.json();

        // Auth check
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get organization
        const { data: profile } = await supabase
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .single();

        if (!profile?.organization_id) {
            return NextResponse.json({ error: 'No organization found' }, { status: 400 });
        }

        const orgId = profile.organization_id;

        // Get or Create Stripe Customer
        const { data: org } = await supabase
            .from('organizations')
            .select('stripe_customer_id, name, contact_email') // Assuming contact_email exists or use user email
            .eq('id', orgId)
            .single();

        let customerId = org?.stripe_customer_id;

        if (!customerId) {
            const customer = await stripe.customers.create({
                email: user.email!, // Use user email
                name: org?.name || 'Organization',
                metadata: {
                    organizationId: orgId
                }
            });
            customerId = customer.id;

            // Save customer ID
            await supabase
                .from('organizations')
                .update({ stripe_customer_id: customerId })
                .eq('id', orgId);
        }

        // Get Price ID from DB
        const { data: priceRecord } = await supabase
            .from('plan_prices')
            .select('stripe_price_id, plan_id, interval')
            .eq('id', planPriceId)
            .single();

        if (!priceRecord || !priceRecord.stripe_price_id) {
             return NextResponse.json({ error: 'Invalid price ID' }, { status: 400 });
        }

        const stripePriceId = priceRecord.stripe_price_id;

        // Create Checkout Session
        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            line_items: [
                {
                    price: stripePriceId,
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            payment_method_types: ['card', 'customer_balance'], // Enable Bank Transfer
            payment_method_options: {
                customer_balance: {
                    funding_type: 'bank_transfer',
                    bank_transfer: {
                        type: 'jp_bank_transfer',
                    },
                },
            },
            success_url: `${process.env.NEXT_PUBLIC_URL}/dashboard/settings?billing_status=success`,
            cancel_url: `${process.env.NEXT_PUBLIC_URL}/dashboard/settings?billing_status=canceled`,
            metadata: {
                organizationId: orgId,
                planId: priceRecord.plan_id
            }
        });

        return NextResponse.json({ url: session.url });
    } catch (error: any) {
        console.error('Stripe Checkout Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
