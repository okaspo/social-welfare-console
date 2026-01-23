'use client'

import dynamic from 'next/dynamic'

// Dynamically import AoiChat with SSR disabled
// This wrapper is necessary because `ssr: false` is not allowed in Server Components (layout.tsx)
const AoiChat = dynamic(() => import('./aoi-chat'), {
    ssr: false,
    loading: () => null
})

export default function AoiChatWrapper() {
    return <AoiChat />
}
