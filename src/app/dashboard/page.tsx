'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'

export default function DashboardRedirect() {
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
        // Replace /dashboard with /swc/dashboard
        const newPath = pathname.replace(/^\/dashboard/, '/swc/dashboard')
        router.replace(newPath)
    }, [pathname, router])

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                <p className="text-gray-600">リダイレクト中...</p>
            </div>
        </div>
    )
}
