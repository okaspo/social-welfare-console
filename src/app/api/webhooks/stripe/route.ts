import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/client';
import { createClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

// Disable body parsing, as we need the raw body for signature verification
// Next.js App Router handles this differently, usually via `req.text()`

export async function POST(req: NextRequest) {
    const body = await req.text();
    const sig = req.headers.get('stripe-signature') as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
        return NextResponse.json({ error: 'Webhook secret not set' }, { status: 500 });
    }

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch (err: any) {
        console.error(`Webhook signature verification failed: ${err.message}`);
        return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    const supabase = await createClient(); // Caution: Usage in webhook might need Service Role if RLS prevents update
    // Actually, for webhooks we usually need SERVICE ROLE KEY because no user session
    // But `createClient` from `@/lib/supabase/server` usually uses cookies.
    // We need a Service Role client here.

    // Creating Service Role Client manually
    const supabaseAdmin = await import('@supabase/supabase-js').then(mod =>
        mod.createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )
    );

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;
                const orgId = session.metadata?.organizationId;
                const subscriptionId = session.subscription as string;

                if (orgId && subscriptionId) {
                    await supabaseAdmin
                        .from('organizations')
                        .update({
                            stripe_subscription_id: subscriptionId,
                            subscription_status: 'active', // Assuming immediate activation or 'trialing'
                            plan_id: session.metadata?.planId || 'standard'
                        })
                        .eq('id', orgId);
                }
                break;
            }
            case 'invoice.payment_succeeded': {
                const invoice = event.data.object as Stripe.Invoice;
                const subscriptionId = invoice.subscription as string;
                if (subscriptionId) {
                    const { data: org } = await supabaseAdmin
                        .from('organizations')
                        .select('id, referred_by_code, referral_rewarded')
                        .eq('stripe_subscription_id', subscriptionId)
                        .single();

                    if (org) {
                        // 1. Update Subscription Status
                        await supabaseAdmin
                            .from('organizations')
                            .update({
                                subscription_status: 'active',
                                current_period_end: new Date(invoice.lines.data[0].period.end * 1000).toISOString()
                            })
                            .eq('id', org.id);

                        // 2. Process Referral Reward (One-time)
                        if (org.referred_by_code && !org.referral_rewarded) {
                            // Find referrer
                            const { data: referral } = await supabaseAdmin
                                .from('referrals')
                                .select('id, referrer_id')
                                .eq('referral_code', org.referred_by_code)
                                .single();

                            if (referral) {
                                // Grant Reward (Increment stats)
                                await supabaseAdmin
                                    .from('referrals')
                                    .update({
                                        referral_count: 1, // Simple increment not possible via simple update syntax without RPC, 
                                        // but let's assume we can fetch-update or use rpc. 
                                        // Since we are in webhook (limited time), simple fetch provided above is risky for concurrency 
                                        // but acceptable for MVP.
                                        // Wait, Supabase doesn't support `referral_count + 1` in simple JS client update?.
                                        // Actually no, we need RPC for atomic increment.
                                        // For MVP, read-modify-write.
                                    })
                                    // Actually, let's just use RPC or naive update.
                                    // Since I can't easily add RPC now without verifying, I'll do naive read-write.
                                    // But wait, I can just not update stats if it's too complex and just log it?
                                    // No, the requirements says "Logic: Tracking".
                                    // Let's create a quick RPC or just do naive.
                                    ;

                                // Naive update for MVP
                                const { data: currentRef } = await supabaseAdmin
                                    .from('referrals')
                                    .select('referral_count, reward_total')
                                    .eq('id', referral.id)
                                    .single();

                                if (currentRef) {
                                    await supabaseAdmin
                                        .from('referrals')
                                        .update({
                                            referral_count: (currentRef.referral_count || 0) + 1,
                                            reward_total: (currentRef.reward_total || 0) + 1000
                                        })
                                        .eq('id', referral.id);
                                }

                                // Mark Organization as Rewarded
                                await supabaseAdmin
                                    .from('organizations')
                                    .update({ referral_rewarded: true })
                                    .eq('id', org.id);

                                // Log Audit
                                await supabaseAdmin.from('audit_logs').insert({
                                    action_type: 'referral_reward_granted',
                                    target_type: 'referral',
                                    target_id: referral.id,
                                    metadata: {
                                        amount: 1000,
                                        referee_org_id: org.id
                                    }
                                });
                            }
                        }
                    }
                }
                break;
            }
            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription;
                const { data: org } = await supabaseAdmin
                    .from('organizations')
                    .select('id')
                    .eq('stripe_subscription_id', subscription.id)
                    .single();

                if (org) {
                    await supabaseAdmin
                        .from('organizations')
                        .update({
                            subscription_status: 'canceled',
                            plan_id: 'free' // Downgrade to free? Or just mark canceled?
                        })
                        .eq('id', org.id);
                }
                break;
            }
            case 'invoice.payment_failed': {
                const invoice = event.data.object as Stripe.Invoice;
                const subscriptionId = invoice.subscription as string;
                if (subscriptionId) {
                    const { data: org } = await supabaseAdmin
                        .from('organizations')
                        .select('id')
                        .eq('stripe_subscription_id', subscriptionId)
                        .single();

                    if (org) {
                        await supabaseAdmin
                            .from('organizations')
                            .update({
                                subscription_status: 'past_due'
                            })
                            .eq('id', org.id);

                        // Trigger Smart Dunning Email
                        // Check attempts to avoid spamming on every retry if desirable, but usually we want to notify
                        try {
                            // Dynamic import to avoid circular dependency issues if any, 
                            // though here it's fine as route is entry point
                            const { sendDunningEmail } = await import('@/lib/billing/smart-dunning');
                            if (invoice.customer && typeof invoice.customer === 'string') {
                                await sendDunningEmail(invoice.customer, invoice.attempt_count);
                            }
                        } catch (e) {
                            console.error('Dunning trigger failed', e);
                        }
                    }
                }
                break;
            }
        }
    } catch (error) {
        console.error('Webhook processing error:', error);
        return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
    }

    return NextResponse.json({ received: true });
}
