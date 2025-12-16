// Billing Configuration - Stripe Plan Mapping
// Maps internal plan IDs to Stripe Price IDs

export const STRIPE_PLANS = {
    free: {
        name: 'Free',
        prices: {
            monthly: null,
            yearly: null,
        },
    },
    standard: {
        name: 'Standard',
        prices: {
            monthly: process.env.NEXT_PUBLIC_STRIPE_STANDARD_MONTHLY || '',
            yearly: process.env.NEXT_PUBLIC_STRIPE_STANDARD_YEARLY || '',
        },
        amount: {
            monthly: 9800, // ¥9,800/月
            yearly: 98000, // ¥98,000/年 (2ヶ月分お得)
        },
    },
    pro: {
        name: 'Pro',
        prices: {
            monthly: process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY || '',
            yearly: process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY || '',
        },
        amount: {
            monthly: 29800, // ¥29,800/月
            yearly: 298000, // ¥298,000/年
        },
    },
    enterprise: {
        name: 'Enterprise',
        prices: {
            monthly: null, // Contact sales
            yearly: null,
        },
        amount: {
            monthly: null,
            yearly: null,
        },
    },
} as const;

export type PlanId = keyof typeof STRIPE_PLANS;
export type BillingInterval = 'monthly' | 'yearly';

export function getPriceId(plan: PlanId, interval: BillingInterval): string | null {
    return STRIPE_PLANS[plan]?.prices[interval] || null;
}

export function getAmount(plan: PlanId, interval: BillingInterval): number | null {
    return STRIPE_PLANS[plan]?.amount?.[interval] || null;
}

export function formatPrice(amount: number | null): string {
    if (!amount) return '要相談';
    return new Intl.NumberFormat('ja-JP', {
        style: 'currency',
        currency: 'JPY',
    }).format(amount);
}
