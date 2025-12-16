import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import Stripe from "https://esm.sh/stripe@14.14.0"

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
    apiVersion: '2024-11-20.acacia', // Updated to match user's version
    httpClient: Stripe.createFetchHttpClient(),
})

serve(async (req) => {
    // 1. Verify Request
    // In a real scenario, verify the webhook signature from Supabase Database Webhook
    // For now, we assume it's called via the configured database webhook with correct headers

    try {
        const payload = await req.json()
        console.log('Webhook payload:', payload)

        // Expected payload format from Supabase Database Webhook
        // { type: 'UPDATE', table: 'organizations', record: { ... }, old_record: { ... }, schema: 'public' }

        if (payload.type !== 'UPDATE' || payload.table !== 'organizations') {
            return new Response('Ignored', { status: 200 })
        }

        const record = payload.record
        const oldRecord = payload.old_record

        // 2. Check if name changed
        if (record.name === oldRecord.name) {
            return new Response('Name not changed', { status: 200 })
        }

        // 3. Check if Stripe Customer ID exists
        if (!record.stripe_customer_id) {
            console.log('No Stripe Customer ID for org:', record.id)
            return new Response('No Stripe ID', { status: 200 })
        }

        // 4. Update Stripe Customer
        console.log(`Updating Stripe Customer ${record.stripe_customer_id} with name: ${record.name}`)

        await stripe.customers.update(record.stripe_customer_id, {
            name: record.name,
            // creating address object if address changed could also be done here
            metadata: {
                organization_id: record.id,
                updated_at: new Date().toISOString()
            }
        })

        return new Response(JSON.stringify({ success: true }), {
            headers: { "Content-Type": "application/json" },
            status: 200,
        })

    } catch (error) {
        console.error('Error processing webhook:', error)
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { "Content-Type": "application/json" },
            status: 500,
        })
    }
})
