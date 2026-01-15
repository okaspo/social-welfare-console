// Smart Dunning System with Aoi's Voice
// Automated payment retry emails with AI-generated content

'use server';

import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import OpenAI from 'openai';
import { sendEmail } from '@/lib/email/resend';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    // @ts-ignore
    apiVersion: '2024-11-20.acacia',
});

// Lazy initialize OpenAI client to avoid build-time errors
function getOpenAIClient() {
    return new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
}

interface DunningEmailParams {
    customerEmail: string;
    customerName: string;
    amountDue: number;
    dueDate: string;
    planName: string;
    attemptNumber: number;
}

/**
 * Generate dunning email with Aoi's voice
 */
async function generateDunningEmail(params: DunningEmailParams): Promise<string> {
    const prompt = `
あなたは「葵さん」です。社会福祉法人を支援する丁寧で知的なAIアシスタントです。

# 状況
- お客様: ${params.customerName}様
- プラン: ${params.planName}
- 未払い金額: ¥${params.amountDue.toLocaleString('ja-JP')}
- 支払い期限: ${params.dueDate}
- リトライ回数: ${params.attemptNumber}回目

# タスク
決済が失敗したお客様に、再度お支払いをお願いするメールを書いてください。

# トーン
- 丁寧で温かい
- 押し付けがましくない
- ${params.attemptNumber === 1 ? '初回は軽めに、システムエラーの可能性も示唆' : '2回目以降は少し緊迫感を出しつつも、サポートの姿勢を強調'}

# 構成
1. 挨拶
2. 決済失敗のお知らせ
3. 再決済のお願い
4. サポートへの誘導（困っている場合）
5. 締めの挨拶

# 出力
メール本文のみを出力してください。件名は不要です。
`.trim();

    const completion = await getOpenAIClient().chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
    });

    return completion.choices[0].message.content || 'メール生成に失敗しました。';
}

/**
 * Send dunning email for failed payment
 */
export async function sendDunningEmail(
    customerId: string,
    attemptNumber: number = 1
): Promise<{ success: boolean; error?: string }> {
    try {
        const adminSupabase = createAdminClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Get organization by Stripe customer ID
        const { data: org } = await adminSupabase
            .from('organizations')
            .select('*, plan_limits(name)')
            .eq('stripe_customer_id', customerId)
            .single();

        if (!org) {
            return { success: false, error: 'Organization not found' };
        }

        // Get customer from Stripe
        const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;

        if (!customer.email) {
            return { success: false, error: 'Customer email not found' };
        }

        // Get latest invoice
        const invoices = await stripe.invoices.list({
            customer: customerId,
            limit: 1,
        });

        if (invoices.data.length === 0) {
            return { success: false, error: 'No invoice found' };
        }

        const invoice = invoices.data[0];

        // Generate email content
        const emailBody = await generateDunningEmail({
            customerEmail: customer.email,
            customerName: customer.name || '様',
            amountDue: invoice.amount_due / 100, // Convert from cents
            dueDate: new Date(invoice.due_date! * 1000).toLocaleDateString('ja-JP'),
            // @ts-ignore
            planName: org.plan_limits?.name || 'プラン',
            attemptNumber,
        });


        // ... (existing code)

        // Send email via Resend
        const emailResult = await sendEmail({
            to: customer.email,
            subject: '【重要】S級AI事務局 葵より：ご利用料金の決済について確認のお願い',
            html: emailBody.replace(/\n/g, '<br/>'), // Simple formatting
        });

        if (!emailResult.success) {
            console.error('Failed to send dunning email', emailResult.error);
            return { success: false, error: 'Email sending failed' };
        }

        // Log dunning attempt
        await adminSupabase.from('audit_logs').insert({
            action_type: 'dunning_email_sent',
            target_type: 'organization',
            target_id: org.id,
            metadata: {
                customerId,
                attemptNumber,
                amountDue: invoice.amount_due / 100,
                // @ts-ignore
                emailId: emailResult.data?.id
            },
        });

        return { success: true };
    } catch (error: any) {
        console.error('Dunning email error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Handle Stripe webhook for failed payments
 */
export async function handlePaymentFailed(event: Stripe.Event) {
    const invoice = event.data.object as Stripe.Invoice;

    if (!invoice.customer) return;

    const customerId = typeof invoice.customer === 'string'
        ? invoice.customer
        : invoice.customer.id;

    // Get attempt number from invoice metadata
    const attemptNumber = invoice.attempt_count || 1;

    // Send dunning email
    await sendDunningEmail(customerId, attemptNumber);

    // Update organization status
    const adminSupabase = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    await adminSupabase
        .from('organizations')
        .update({ subscription_status: 'past_due' })
        .eq('stripe_customer_id', customerId);
}

/**
 * Create Stripe checkout session with bank transfer support
 */
export async function createCheckoutSession(
    priceId: string,
    organizationId: string,
    paymentMethod: 'card' | 'bank_transfer' = 'card'
): Promise<{ url?: string; error?: string }> {
    try {
        const adminSupabase = createAdminClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { data: org } = await adminSupabase
            .from('organizations')
            .select('id, name, stripe_customer_id')
            .eq('id', organizationId)
            .single();

        if (!org) {
            return { error: 'Organization not found' };
        }

        // Create checkout session
        const sessionParams: Stripe.Checkout.SessionCreateParams = {
            customer: org.stripe_customer_id || undefined,
            line_items: [{ price: priceId, quantity: 1 }],
            mode: 'subscription',
            success_url: `${process.env.NEXT_PUBLIC_URL}/swc/dashboard/settings/billing?success=true`,
            cancel_url: `${process.env.NEXT_PUBLIC_URL}/swc/dashboard/settings/billing`,
            metadata: {
                organization_id: organizationId,
            },
        };

        // Add payment method types
        if (paymentMethod === 'bank_transfer') {
            sessionParams.payment_method_types = ['customer_balance'];
            sessionParams.payment_method_options = {
                customer_balance: {
                    funding_type: 'bank_transfer',
                    bank_transfer: {
                        type: 'jp_bank_transfer',
                    },
                },
            };
        } else {
            sessionParams.payment_method_types = ['card'];
        }

        const session = await stripe.checkout.sessions.create(sessionParams);

        return { url: session.url || undefined };
    } catch (error: any) {
        console.error('Checkout session error:', error);
        return { error: error.message };
    }
}
