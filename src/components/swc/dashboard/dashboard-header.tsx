'use client'

import { useOrganizationContext } from '@/context/organization-context'

export function DashboardHeader() {
    const { organization, profile, isLoading } = useOrganizationContext()

    // Default Fallback
    const corporationName = organization?.name || '社会福祉法人 〇〇会'
    const organizationPlan = organization?.plan
    const userInitials = profile?.full_name ? profile.full_name.slice(0, 2) : 'AD'

    if (isLoading) {
        return (
            <header className="h-16 border-b border-gray-100 flex items-center justify-between px-8 bg-white/80 backdrop-blur-md sticky top-0 z-10 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="h-5 w-48 bg-gray-200 animate-pulse rounded"></div>
                </div>
                <div className="h-9 w-9 rounded-full bg-gray-200 animate-pulse"></div>
            </header>
        )
    }

    return (
        <header className="h-16 border-b border-gray-100 flex items-center justify-between px-8 bg-white/80 backdrop-blur-md sticky top-0 z-10 shadow-sm">
            <div className="flex items-center gap-3 text-sm font-medium text-gray-600">
                {corporationName}
                {organizationPlan && (
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${organizationPlan === 'PRO' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                        organizationPlan === 'ENTERPRISE' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                            'bg-blue-50 text-blue-700 border-blue-100'
                        } `}>
                        {organizationPlan}
                    </span>
                )}
            </div>
            <div className="flex items-center gap-4">
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-xs font-semibold text-gray-700 shadow-sm ring-2 ring-white">
                    {userInitials}
                </div>
            </div>
        </header>
    )
}
