import { getUsers } from "@/lib/actions/admin-users";
import UserManagementClient from "./user-management";

export default async function AdminUsersPage({
    searchParams,
}: {
    searchParams: Promise<{ q?: string; page?: string }>;
}) {
    const params = await searchParams;
    const query = params.q || '';
    const page = Number(params.page) || 1;

    // Fetch initial data on server
    const { users, total } = await getUsers(query, page);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-800">User Management</h1>
                <div className="text-sm text-slate-500">
                    Total Users: {total}
                </div>
            </div>

            <UserManagementClient initialUsers={users} />
        </div>
    );
}
