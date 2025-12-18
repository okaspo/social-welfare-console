import { createClient } from '@/lib/supabase/server'
import { AlertCircle, CalendarClock } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import NextLink from 'next/link'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

export async function SubscriptionAlert() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single()

    if (!profile?.organization_id) return null

    const { data: org } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', profile.organization_id)
        .single()

    if (!org) return null

    const now = new Date()
    const gracePeriodEnd = org.grace_period_end ? new Date(org.grace_period_end) : null
    const currentPeriodEnd = org.current_period_end ? new Date(org.current_period_end) : null

    // 1. Check for Past Due / Grace Period
    const isPastDue = ['past_due', 'unpaid'].includes(org.subscription_status || '')

    if (isPastDue) {
        if (gracePeriodEnd && now < gracePeriodEnd) {
            // In Grace Period
            return (
                <div className="mb-4">
                    <Alert variant="destructive" className="bg-red-50 border-red-200">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <AlertTitle className="text-red-800 font-bold flex items-center gap-2">
                            お支払いの確認が取れていません
                        </AlertTitle>
                        <AlertDescription className="text-red-700 flex justify-between items-center mt-2">
                            <span>
                                {format(gracePeriodEnd, 'yyyy年MM月dd日', { locale: ja })}まで猶予期間として機能を利用できますが、それまでに決済情報の更新が必要です。
                            </span>
                            <Button asChild size="sm" variant="destructive" className="ml-4">
                                <NextLink href="/dashboard/settings/billing">
                                    お支払い情報を更新
                                </NextLink>
                            </Button>
                        </AlertDescription>
                    </Alert>
                </div>
            )
        }
    }

    // 2. Check for Cancellation Scheduled
    if (org.cancel_at_period_end && currentPeriodEnd && now < currentPeriodEnd && org.plan !== 'free') {
        return (
            <div className="mb-4">
                <Alert className="bg-yellow-50 border-yellow-200">
                    <CalendarClock className="h-4 w-4 text-yellow-600" />
                    <AlertTitle className="text-yellow-800 font-bold">
                        解約予約中です
                    </AlertTitle>
                    <AlertDescription className="text-yellow-700 flex justify-between items-center mt-1">
                        <span>
                            {format(currentPeriodEnd, 'yyyy年MM月dd日', { locale: ja })}までPro機能をご利用いただけます。その後、Freeプランへ自動的にダウングレードされます。
                        </span>
                        <Button asChild size="sm" variant="outline" className="ml-4 border-yellow-300 text-yellow-800 hover:bg-yellow-100">
                            <NextLink href="/dashboard/settings/billing">
                                契約を継続する
                            </NextLink>
                        </Button>
                    </AlertDescription>
                </Alert>
            </div>
        )
    }

    return null
}
