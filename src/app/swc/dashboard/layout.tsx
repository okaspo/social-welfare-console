import Link from 'next/link'
import { SubscriptionAlert } from '@/components/swc/billing/subscription-alert'
import { createClient } from '@/lib/supabase/server'
import { OrganizationProvider } from '@/context/organization-context'
import { DashboardHeader } from '@/components/swc/dashboard/dashboard-header'
import { SWCDashboardSidebar } from '@/components/swc/dashboard-sidebar'
import dynamic from 'next/dynamic'

// Dynamically import AoiChat with SSR disabled to prevent hydration errors and client-side exceptions
const AoiChat = dynamic(() => import('@/components/swc/chat/aoi-chat'), {
    ssr: false,
    loading: () => null // Optional: Render nothing while loading
})

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    // We can keep server-side auth check or rely on Middleware.
    // Keeping it light here just to ensure we have a client for server actions if needed,
    // but primarily Context will handle data fetching.
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    return (
        <OrganizationProvider>
            <div className="flex min-h-screen bg-white">
                {/* Sidebar */}
                <SWCDashboardSidebar />

                {/* Main Content Area */}
                <main className="flex-1 flex flex-col min-w-0 bg-gradient-to-br from-white to-gray-50/30">

                    {/* GLOBAL ALERT BAR */}
                    <SubscriptionAlert />

                    {/* Header */}
                    <DashboardHeader />

                    {/* Page Content */}
                    <div className="flex-1 p-8 md:p-10 overflow-auto">
                        {children}
                    </div>
                </main>

                <AoiChat />
            </div>
        </OrganizationProvider >
    )
}
