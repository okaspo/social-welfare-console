import { redirect } from 'next/navigation'

/**
 * Redirect to the unified chat page at /chat
 * This consolidates all chat functionality in one location
 */
export default function DashboardChatPage() {
    redirect('/chat')
}
