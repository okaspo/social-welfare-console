import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PlanSettings from '@/components/organization/plan-settings'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function BillingPage({
    searchParams,
}: {
    searchParams?: { [key: string]: string | string[] | undefined }
}) {
    const supabase = await createClient()

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
        redirect('/login')
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select(`
            organization:organizations (
                plan
            )
        `)
        .eq('id', user.id)
        .single()

    const org = Array.isArray(profile?.organization) ? profile?.organization[0] : profile?.organization
    const currentPlan = org?.plan || 'FREE'

    // Fetch Prices
    // Logic: is_public OR campaign_code == promo
    const promoCode = searchParams?.promo as string | undefined

    // Note: Supabase JS doesn't support sophisticated OR across conditional logic easily in one query without RPC mostly.
    // simpler: fetch all public, and if promo code exists, fetch that specific one too.

    // 1. Fetch public
    const { data: publicPrices } = await supabase
        .from('plan_prices')
        .select('*, plan_limits(name)')
        .eq('is_public', true)

    let prices = publicPrices || []

    // 2. Fetch hidden if promo
    if (promoCode) {
        const { data: promoPrices } = await supabase
            .from('plan_prices')
            .select('*, plan_limits(name)')
            .eq('campaign_code', promoCode)

        if (promoPrices && promoPrices.length > 0) {
            // merge
            // Use map to avoid duplicates?
            const existingIds = new Set(prices.map(p => p.id))
            const newPrices = promoPrices.filter(p => !existingIds.has(p.id))
            prices = [...prices, ...newPrices]
        }
    }

    // Cast types for UI
    const formattedPrices = prices.map(p => ({
        ...p,
        plan_limits: Array.isArray(p.plan_limits) ? p.plan_limits[0] : p.plan_limits
    }))

    return (
        <div className="max-w-5xl mx-auto space-y-8 p-6 pb-20">
            <div>
                <Link href="/dashboard/settings" className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1 mb-4">
                    <ArrowLeft className="h-4 w-4" />
                    設定に戻る
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">プランと支払い</h1>
                <p className="text-sm text-gray-500 mt-1">
                    現在のプランの確認と変更ができます。
                </p>
                {promoCode && (
                    <div className="mt-4 bg-yellow-50 text-yellow-800 px-4 py-2 rounded-md text-sm font-bold inline-block">
                        キャンペーンコード「{promoCode}」が適用されています
                    </div>
                )}
            </div>

            <PlanSettings currentPlan={currentPlan} prices={formattedPrices} />
        </div>
    )
}
