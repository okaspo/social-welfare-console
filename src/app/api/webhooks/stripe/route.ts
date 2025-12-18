import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { getAdminClient } from '@/lib/supabase/admin';

export async function POST(req: Request) {
    const body = await req.text();
    const signature = (await headers()).get('Stripe-Signature') as string;

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (error: any) {
        console.error(`Webhook signature verification failed: ${error.message}`);
        return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
    }

    const supabase = getAdminClient();
    const session = event.data.object as Stripe.Checkout.Session;
    const subscription = event.data.object as Stripe.Subscription;
    const invoice = event.data.object as Stripe.Invoice;

    // Common function to update organization subscription
    const updateSubscription = async (
        customerId: string,
        subscriptionId: string,
        status: string,
        currentPeriodEnd: number | null
    ) => {
        // 1. Find organization by stripe_customer_id
        const { data: orgs, error: findError } = await supabase
            .from('organizations')
            .select('id')
            .eq('stripe_customer_id', customerId)
            .limit(1);

        if (findError || !orgs || orgs.length === 0) {
            console.error(`Organization not found for customer: ${customerId}`);
            return;
        }

        const orgId = orgs[0].id;

        // 2. Update status
        // Note: 'currentPeriodEnd' from Stripe is unix timestamp (seconds). Postgres timestamp is usually ISO string or similar.
        // Supabase/Postgres handles ISO strings well.
        const periodEndIso = currentPeriodEnd
            ? new Date(currentPeriodEnd * 1000).toISOString()
            : null;

        const { error: updateError } = await supabase
            .from('organizations')
            .update({
                stripe_subscription_id: subscriptionId,
                subscription_status: status,
                current_period_end: periodEndIso,
                updated_at: new Date().toISOString()
            })
            .eq('id', orgId);

        if (updateError) {
            console.error(`Failed to update organization ${orgId}: ${updateError.message}`);
        } else {
            console.log(`Updated organization ${orgId} subscription to ${status}`);
        }
    };

    try {
        switch (event.type) {
            case 'checkout.session.completed':
                // Initial subscription creation usually happens here or in 'customer.subscription.created'
                // But we need to link customer_id if not already linked (e.g. if we created customer during checkout)
                const checkoutSession = event.data.object as Stripe.Checkout.Session;
                if (checkoutSession.mode === 'subscription') {
                    const clientReferenceId = checkoutSession.client_reference_id; // orgId passed from Client
                    const customerId = checkoutSession.customer as string;
                    const subscriptionId = checkoutSession.subscription as string;

                    if (clientReferenceId) {
                        await supabase.from('organizations').update({
                            stripe_customer_id: customerId,
                            stripe_subscription_id: subscriptionId
                        }).eq('id', clientReferenceId);
                    }
                }
                break;

            case 'invoice.payment_succeeded':
                // Cast to any to handle Stripe v20 type updates
                const invoiceObj = invoice as any;
                if (invoiceObj.subscription) {
                    const subId = invoiceObj.subscription as string;
                    const sub = await stripe.subscriptions.retrieve(subId);
                    const subAny = sub as any; // Handle Response wrapper type issues
                    await updateSubscription(
                        invoiceObj.customer as string,
                        subId,
                        subAny.status,
                        subAny.current_period_end
                    );
                }
                break;

            case 'customer.subscription.updated':
                // Explicitly cast to any to avoid type mismatch if library version differs
                const subObj = subscription as any;
                await updateSubscription(
                    subObj.customer as string,
                    subObj.id,
                    subObj.status,
                    subObj.current_period_end
                );
                break;

            case 'customer.subscription.deleted':
                // handle subscription cancellation automatically
                await updateSubscription(
                    subscription.customer as string,
                    subscription.id,
                    'canceled', // or subscription.status which should be 'canceled'
                    null // Period end is irrelevant if canceled immediately, or keep it? usually keep history or null.
                );
                break;

            default:
                console.log(`Unhandled event type ${event.type}`);
        }
    } catch (error: any) {
        console.error(`Error handling webhook: ${error.message}`);
        return new NextResponse('Webhook handler failed', { status: 500 });
    }

    return new NextResponse('Webhook received', { status: 200 });
}
