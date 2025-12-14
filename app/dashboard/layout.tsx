import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { UserSidebar } from "@/components/dashboard/user-sidebar";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // For MVP, if no auth, we might want to redirect to login.
    // However, keeping loose for now as per previous logic, but ideally:
    if (!user) { redirect("/login"); }

    return (
        <div className="flex h-screen bg-slate-50">
            {/* Sidebar */}
            <div className="hidden md:block h-full">
                <UserSidebar user={user} />
            </div>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto w-full">
                <header className="h-16 border-b border-red-100 bg-white flex items-center justify-between px-6 sticky top-0 z-10 shadow-sm">
                    <h1 className="text-lg font-bold text-slate-800">ダッシュボード</h1>
                    {/* Add header actions if needed, e.g., notifications */}
                </header>

                <div className="p-8 max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
