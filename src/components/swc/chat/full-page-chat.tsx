'use client'

import ChatCore from './chat-core'

// ============================================================================
// Types
// ============================================================================

interface FullPageChatProps {
    personaId?: string
    personaName?: string
}

// ============================================================================
// Component - Full Page Chat Wrapper
// ============================================================================

export default function FullPageChat({
    personaId = 'aoi',
    personaName = '葵'
}: FullPageChatProps) {
    return (
        <ChatCore
            variant="fullpage"
            personaId={personaId}
            personaName={personaName}
            avatarUrl="/assets/avatars/aoi_face_icon.jpg"
            showHeader={true}
            showSaveButton={true}
            showClearButton={true}
            className="h-full"
        />
    )
}
