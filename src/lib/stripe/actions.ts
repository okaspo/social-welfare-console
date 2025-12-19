'use server'

import { stripe } from './client'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

/**
 * Create a Stripe Checkout Session for subscription
 */
export async function createCheckoutSession(priceId: string, returnUrl: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Unauthorized')
    }

    // Get organization details
    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single()

    if (!profile?.organization_id) throw new Error('No organization')

    const { data: org } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', profile.organization_id)
        .single()

    // Retrieve or Create Stripe Customer
    let customerId = org.stripe_customer_id

    if (!customerId) {
        const customer = await stripe.customers.create({
            email: user.email,
            name: org.name,
            metadata: {
                organization_id: org.id
            }
        })
        customerId = customer.id

        // Save customer ID
        await supabase
            .from('organizations')
            .update({ stripe_customer_id: customerId })
            .eq('id', org.id)
    }

    // Get Stripe Price ID
    const { data: planPrice } = await supabase
        .from('plan_prices')
        .select('stripe_price_id, mode')
        .eq('id', priceId)
        .single()

    // Fallback if price ID is missing (should be in DB, otherwise use a placeholder or error)
    // IMPORTANT: In prod, stripe_price_id must be set in DB.
    // For dev, if not set, we might throw or use env.
    if (!planPrice?.stripe_price_id) {
        throw new Error('Price configuration missing')
    }

    const session = await stripe.checkout.sessions.create({
        customer: customerId,
        line_items: [
            {
                price: planPrice.stripe_price_id,
                quantity: 1,
            },
        ],
        mode: (planPrice.mode as 'subscription' | 'payment') || 'subscription',
        success_url: `${returnUrl}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${returnUrl}`,
        // Enable Bank Transfer
        payment_method_types: ['card', 'customer_balance'],
        payment_method_options: {
            customer_balance: {
                funding_type: 'bank_transfer',
                bank_transfer: {
                    type: 'jp_bank_transfer', // Japan specific
                },
            },
        },
        metadata: {
            organization_id: org.id,
            plan_price_id: priceId
        },
        allow_promotion_codes: true,
    })

    return { url: session.url }
}

/**
 * Create a Stripe Customer Portal Session
 */
export async function createPortalSession(returnUrl: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Unauthorized')

    const { data: profile } = await supabase
        .from('profiles')
        .select('organization:organizations(stripe_customer_id)')
        .eq('id', user.id)
        .single()

    // @ts-ignore
    const customerId = profile?.organization?.stripe_customer_id || (Array.isArray(profile?.organization) ? profile?.organization[0]?.stripe_customer_id : null)

    if (!customerId) {
        throw new Error('No billing account found')
    }

    const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
    })

    return { url: session.url }
}
