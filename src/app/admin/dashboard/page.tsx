import { redirect } from 'next/navigation';

// Legacy dashboard - redirect to SWC console
export default function AdminDashboardPage() {
    redirect('/admin/swc');
}
