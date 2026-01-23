'use client'

import dynamic from 'next/dynamic'

// Dynamically import AoiChat with SSR disabled
// This wrapper is necessary because `ssr: false` is not allowed in Server Components (layout.tsx)
const AoiChat = dynamic(() => import('./aoi-chat'), {
    ssr: false,
    loading: () => <div className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gray-100/50 rounded-full border flex items-center justify-center text-[10px] text-gray-500 animate-pulse">Wait...</div>
})

export default function AoiChatWrapper() {
    return <AoiChat />
}
