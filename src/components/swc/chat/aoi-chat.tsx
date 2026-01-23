'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Bot } from 'lucide-react'
import ChatCore from './chat-core'

// ============================================================================
// Types
// ============================================================================

interface AoiChatProps {
    /** ページパスでの非表示リスト */
    hiddenPaths?: string[]
}

// ============================================================================
// Component - Popup Chat Wrapper
// ============================================================================

export default function AoiChat({
    hiddenPaths = ['/swc/dashboard/chat', '/swc/dashboard/organization']
}: AoiChatProps) {
    const pathname = usePathname()
    const [isOpen, setIsOpen] = useState(false)
    const [isMounted, setIsMounted] = useState(false)

    // Client-side mount check (for SSR safety)
    useEffect(() => {
        setIsMounted(true)
    }, [])

    // ========================================================================
    // Render conditions - ALL hooks must be above this
    // ========================================================================
    const shouldRender = isMounted && !hiddenPaths.includes(pathname)

    if (!shouldRender) return null

    // ========================================================================
    // Render
    // ========================================================================
    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {/* Chat Window */}
            {isOpen && (
                <div className="mb-4 w-80 md:w-96 h-[500px] animate-in slide-in-from-bottom-5 duration-200">
                    <ChatCore
                        variant="popup"
                        personaId="aoi"
                        personaName="葵"
                        avatarUrl="/assets/avatars/aoi_face_icon.jpg"
                        showHeader={true}
                        showSaveButton={true}
                        onClose={() => setIsOpen(false)}
                    />
                </div>
            )}

            {/* Toggle Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="group flex items-center gap-3 bg-[#607D8B] text-white px-5 py-3 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                >
                    <div className="relative">
                        <div className="w-8 h-8 rounded-full bg-white/20 border border-white/30 flex items-center justify-center overflow-hidden">
                            <img
                                src="/assets/avatars/aoi_face_icon.jpg"
                                alt="Aoi"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    // Fallback to Bot icon if image fails
                                    (e.target as HTMLImageElement).style.display = 'none'
                                }}
                            />
                        </div>
                        <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-green-400 border-2 border-[#607D8B] rounded-full"></span>
                    </div>
                    <span className="font-bold tracking-wide text-sm pr-1">AOI CHAT</span>
                </button>
            )}
        </div>
    )
}
