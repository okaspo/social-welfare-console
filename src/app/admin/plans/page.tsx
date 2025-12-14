import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PriceManager from '@/components/admin/price-manager'

export default async function AdminPlansPage() {
    const supabase = await createClient()

    // 1. Check Admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // 2. Fetch Data
    // Fetch Plans
    const { data: plans } = await supabase
        .from('plan_limits')
        .select('*')
        .order('plan_id')

    // Fetch Prices
    const { data: prices } = await supabase
        .from('plan_prices')
        .select('*')
        .order('created_at', { ascending: false })

    return (
        <div className="max-w-6xl mx-auto p-8">
            <h1 className="text-3xl font-bold mb-8">Plan & Pricing Management</h1>
            <PriceManager plans={plans || []} prices={prices || []} />
        </div>
    )
}
