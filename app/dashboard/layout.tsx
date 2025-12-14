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

    if (!user) { redirect("/login"); }

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <div className="hidden md:block h-full">
                <UserSidebar user={user} />
            </div>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto w-full">
                <header className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-6 sticky top-0 z-10">
                    <h1 className="text-lg font-semibold text-gray-900">ダッシュボード</h1>
                </header>

                <div className="p-8 max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
