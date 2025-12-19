import { headers } from 'next/headers'
import { stripe } from '@/lib/stripe/client'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

export async function POST(req: Request) {
    const body = await req.text()
    const signature = (await headers()).get('Stripe-Signature') as string

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
        throw new Error('STRIPE_WEBHOOK_SECRET not set')
    }

    let event: Stripe.Event

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET
        )
    } catch (error: any) {
        console.error(`Webhook signature verification failed: ${error.message}`)
        return new Response(`Webhook Error: ${error.message}`, { status: 400 })
    }

    const supabase = await createClient()

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as any

                // Retrieve subscription to get status
                const subscriptionId = session.subscription as string
                const subscription = await stripe.subscriptions.retrieve(subscriptionId) as any

                const organizationId = session.metadata?.organization_id
                const planPriceId = session.metadata?.plan_price_id

                if (!organizationId) {
                    console.error('Missing organization_id in metadata')
                    break;
                }

                // Get Plan ID from Price ID (if needed, or assume metadata carries it)
                // We need to look up the plan_id from plan_prices
                let planId = 'STANDARD' // Default
                if (planPriceId) {
                    const { data: priceData } = await supabase.from('plan_prices').select('plan_id').eq('id', planPriceId).single()
                    if (priceData) planId = priceData.plan_id
                }

                await supabase.from('organizations').update({
                    stripe_subscription_id: subscription.id,
                    stripe_customer_id: session.customer as string,
                    subscription_status: subscription.status,
                    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                    cancel_at_period_end: subscription.cancel_at_period_end,
                    plan: planId // Upgrade plan
                }).eq('id', organizationId)

                break
            }

            case 'customer.subscription.updated': {
                const subscription = event.data.object as any

                // Find organization by subscription ID or customer ID
                // Ideally Stripe Customer ID is unique to organization

                await supabase.from('organizations').update({
                    subscription_status: subscription.status,
                    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                    cancel_at_period_end: subscription.cancel_at_period_end,
                }).eq('stripe_subscription_id', subscription.id)

                break
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object as any

                // Use simple query without table alias to avoid Postgrest errors
                // If existing implementation uses aliases in JOIN, plain UPDATE is different.

                await supabase.from('organizations').update({
                    subscription_status: 'canceled',
                    plan: 'FREE', // Downgrade
                    cancel_at_period_end: false
                }).eq('stripe_subscription_id', subscription.id)

                break
            }

            case 'invoice.payment_succeeded': {
                const invoice = event.data.object as any
                // invoice.subscription can be string or object. Cast to string if ID.
                const subscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id

                // If Bank Transfer, this event confirms payment
                // Status sync is handled by subscription.updated usually, but good to ensure

                if (subscriptionId) {
                    const subscription = await stripe.subscriptions.retrieve(subscriptionId) as any
                    await supabase.from('organizations').update({
                        subscription_status: subscription.status,
                        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                    }).eq('stripe_subscription_id', subscriptionId)
                }
                break
            }
        }
    } catch (error: any) {
        console.error(`Webhook handler failed: ${error.message}`)
        return new Response(`Webhook Error: ${error.message}`, { status: 500 })
    }

    return new Response(null, { status: 200 })
}
