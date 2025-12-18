'use server'

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { stripe } from "@/lib/stripe"
import { headers } from "next/headers"

export async function changePlan(priceId: string) {
    const supabase = await createClient()

    // 1. Auth Check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // 2. Get User's Organization
    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id, organization:organizations(id, name, email, stripe_customer_id)')
        .eq('id', user.id)
        .single()

    if (!profile?.organization_id) return { error: 'No organization linked to user' }

    // Type assertion for nested join if needed, or trust supabase types
    const org = profile.organization as any;

    // 3. Get or Create Stripe Customer
    let customerId = org.stripe_customer_id;

    if (!customerId) {
        const customer = await stripe.customers.create({
            email: user.email, // Use user email or org email
            name: org.name,
            metadata: {
                organization_id: org.id
            }
        });
        customerId = customer.id;

        // Save customer ID
        await supabase
            .from('organizations')
            .update({ stripe_customer_id: customerId })
            .eq('id', org.id);
    }

    // 4. Create Checkout Session
    try {
        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            payment_method_types: ['card', 'customer_balance'],
            payment_method_options: {
                customer_balance: {
                    funding_type: 'bank_transfer',
                    bank_transfer: {
                        type: 'jp_bank_transfer',
                    },
                },
            },
            success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/billing?success=true`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/billing?canceled=true`,
            metadata: {
                organization_id: org.id
            },
            client_reference_id: org.id,
        });

        if (!session.url) {
            throw new Error('No session URL returned');
        }

        // Return URL for client-side redirection
        return {
            success: true,
            url: session.url
        }

    } catch (err: any) {
        console.error('Stripe Checkout Error:', err);
        return { error: `Failed to start checkout: ${err.message}` };
    }
}

export async function cancelSubscription() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    // Get User's Organization
    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single()

    if (!profile?.organization_id) return { error: 'No organization linked' }

    // In real Stripe implementation: stripe.subscriptions.update(subId, { cancel_at_period_end: true })
    // Here we just update DB
    const { error } = await supabase
        .from('organizations')
        .update({
            cancel_at_period_end: true,
            updated_at: new Date().toISOString()
        })
        .eq('id', profile.organization_id)

    if (error) return { error: error.message }

    revalidatePath('/dashboard/settings/billing')
    return { success: true }
}


export async function managePrice(formData: FormData) {
    const supabase = await createClient()

    // Auth Check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const id = formData.get('id') as string
    const planId = formData.get('planId') as string
    const amount = parseInt(formData.get('amount') as string)
    const interval = formData.get('interval') as 'month' | 'year'
    const campaignCode = formData.get('campaignCode') as string || null
    const isPublic = formData.get('isPublic') === 'true'

    if (!planId || isNaN(amount) || !interval) {
        return { error: 'Missing required fields' }
    }

    const priceData = {
        plan_id: planId,
        amount,
        interval,
        campaign_code: campaignCode || null,
        is_public: isPublic
    }

    let resultError;
    if (id) {
        const { error } = await supabase
            .from('plan_prices')
            .update(priceData)
            .eq('id', id)
        resultError = error
    } else {
        const { error } = await supabase
            .from('plan_prices')
            .insert(priceData)
        resultError = error
    }

    if (resultError) return { error: resultError.message }

    revalidatePath('/admin/plans')
    return { success: true }
}

export async function deletePrice(priceId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { error } = await supabase.from('plan_prices').delete().eq('id', priceId)
    if (error) return { error: error.message }

    revalidatePath('/admin/plans')
    return { success: true }
}
