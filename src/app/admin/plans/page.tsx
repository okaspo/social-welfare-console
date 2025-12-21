import { redirect } from 'next/navigation';

// Redirect legacy /admin/plans to /admin/swc/plans
export default function PlansRedirect() {
    redirect('/admin/swc/plans');
}
