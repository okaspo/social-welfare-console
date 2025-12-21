import { redirect } from 'next/navigation';

// Redirect from legacy /admin/customers to /admin/swc/customers
export default function CustomersRedirect() {
    redirect('/admin/swc/customers');
}
