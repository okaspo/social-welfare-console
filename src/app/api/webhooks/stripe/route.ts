// Stripe Webhook Handler
// Process subscription events and payment failures

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Lazy initialize to avoid build-time issues
function getStripeClient() {
    return new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: '2024-11-20.acacia',
    });
}

function getAdminSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

export async function POST(req: NextRequest) {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
        return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
        const stripe = getStripeClient();
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (error: any) {
        console.error('Webhook signature verification failed:', error.message);
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    console.log(`[Stripe Webhook] ${event.type}`);

    try {
        switch (event.type) {
            // Subscription created
            case 'customer.subscription.created':
            case 'customer.subscription.updated': {
                const subscription = event.data.object as Stripe.Subscription;
                await handleSubscriptionUpdate(subscription);
                break;
            }

            // Subscription deleted/canceled
            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription;
                await handleSubscriptionCanceled(subscription);
                break;
            }

            // Payment succeeded
            case 'invoice.payment_succeeded': {
                const invoice = event.data.object as Stripe.Invoice;
                await handlePaymentSuccess(invoice);
                break;
            }

            // Payment failed (trigger dunning) - use dynamic import
            case 'invoice.payment_failed': {
                // Dynamic import to avoid module-level initialization
                const { handlePaymentFailed } = await import('@/lib/billing/smart-dunning');
                await handlePaymentFailed(event);
                break;
            }

            // Checkout completed
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;
                await handleCheckoutComplete(session);
                break;
            }

            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        return NextResponse.json({ received: true });
    } catch (error: any) {
        console.error('Webhook handler error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * Handle subscription update
 */
async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
    const customerId = typeof subscription.customer === 'string'
        ? subscription.customer
        : subscription.customer.id;

    const updateData = {
        stripe_subscription_id: subscription.id,
        subscription_status: subscription.status,
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    };

    const adminSupabase = getAdminSupabase();
    await adminSupabase
        .from('organizations')
        .update(updateData)
        .eq('stripe_customer_id', customerId);

    console.log(`Updated subscription for customer ${customerId}: ${subscription.status}`);
}

/**
 * Handle subscription cancellation (downgrade to Free)
 */
async function handleSubscriptionCanceled(subscription: Stripe.Subscription) {
    const customerId = typeof subscription.customer === 'string'
        ? subscription.customer
        : subscription.customer.id;

    const adminSupabase = getAdminSupabase();

    // Downgrade to Free plan (data preserved)
    const { data: freePlan } = await adminSupabase
        .from('plan_limits')
        .select('id')
        .eq('name', 'Free')
        .single();

    await adminSupabase
        .from('organizations')
        .update({
            plan_id: freePlan?.id || 'free',
            subscription_status: 'canceled',
            stripe_subscription_id: null,
        })
        .eq('stripe_customer_id', customerId);

    console.log(`Downgraded customer ${customerId} to Free plan`);
}

/**
 * Handle successful payment
 */
async function handlePaymentSuccess(invoice: Stripe.Invoice) {
    const customerId = typeof invoice.customer === 'string'
        ? invoice.customer
        : invoice.customer?.id;

    if (!customerId) return;

    const adminSupabase = getAdminSupabase();

    // Update status to active
    await adminSupabase
        .from('organizations')
        .update({ subscription_status: 'active' })
        .eq('stripe_customer_id', customerId);

    console.log(`Payment successful for customer ${customerId}`);
}

/**
 * Handle checkout completion
 */
async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
    const customerId = typeof session.customer === 'string'
        ? session.customer
        : session.customer?.id;

    const organizationId = session.metadata?.organization_id;

    if (!customerId || !organizationId) return;

    const adminSupabase = getAdminSupabase();

    // Link Stripe customer to organization
    await adminSupabase
        .from('organizations')
        .update({
            stripe_customer_id: customerId,
            payment_method: session.payment_method_types?.[0] === 'customer_balance'
                ? 'bank_transfer'
                : 'card',
        })
        .eq('id', organizationId);

    console.log(`Linked customer ${customerId} to organization ${organizationId}`);
}
