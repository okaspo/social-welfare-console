import { getPublicPrices } from '@/app/actions/billing';
import { BillingContent } from '@/components/billing/billing-content';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function BillingPage(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
    const searchParams = await props.searchParams;
    const promo = typeof searchParams.promo === 'string' ? searchParams.promo : undefined;

    // 1. Fetch Prices (including hidden if promo matches)
    const prices = await getPublicPrices(promo);

    // 2. Fetch Current User Org info to know current plan
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return <div>Please log in.</div>;
    }

    // Get Org ID
    const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single();
    if (!profile?.organization_id) return <div>No Organization found.</div>;

    const { data: org } = await supabase.from('organizations').select('current_price_id').eq('id', profile.organization_id).single();

    return (
        <div className="container mx-auto py-10">
            <h1 className="text-3xl font-bold tracking-tight mb-2">Billing & Plans</h1>
            <p className="text-slate-500 mb-8">Manage your subscription and billing details.</p>

            <BillingContent
                prices={prices}
                orgId={profile.organization_id}
                currentPriceId={org?.current_price_id}
            />
        </div>
    );
}
