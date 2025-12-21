import { redirect } from 'next/navigation';

// Legacy dashboard - redirect to SWC console
export default function AdminDashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    // This layout is deprecated - SWC layout will handle admin UI
    return <>{children}</>;
}

