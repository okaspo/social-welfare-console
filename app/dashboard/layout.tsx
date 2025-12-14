import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
    LayoutDashboard,
    Users,
    FileText,
    CalendarDays,
    BookOpen,
    Settings,
    LogOut
} from "lucide-react";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // For MVP, if no auth, we might want to redirect to login.
    // But for development speed without auth keys, I might comment this out or handle loosely.
    // if (!user) { redirect("/login"); }

    const navItems = [
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { name: "Officers", href: "/dashboard/officers", icon: Users },
        { name: "Meetings", href: "/dashboard/meetings", icon: CalendarDays },
        { name: "Documents", href: "/dashboard/documents", icon: FileText },
        { name: "Annual Report", href: "/dashboard/report", icon: BookOpen },
        { name: "Settings", href: "/dashboard/settings", icon: Settings },
    ];

    return (
        <div className="flex h-screen bg-background">
            {/* Sidebar */}
            <aside className="w-64 border-r border-border bg-card hidden md:flex flex-col">
                <div className="p-6 border-b border-border">
                    <div className="flex items-center gap-2 font-bold text-xl text-primary">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            G
                        </div>
                        GovAI Console
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                        >
                            <item.icon className="w-4 h-4" />
                            {item.name}
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-border">
                    <div className="flex items-center gap-3 p-2 rounded-md hover:bg-accent cursor-pointer transition-colors">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                            {user?.email?.[0].toUpperCase() || "A"}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                                {user?.email || "Admin User"}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                                Social Welfare Corp.
                            </p>
                        </div>
                        <LogOut className="w-4 h-4 text-muted-foreground" />
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                <header className="h-16 border-b border-border flex items-center px-6 bg-background/50 backdrop-blur-sm sticky top-0 z-10">
                    <h1 className="text-lg font-semibold">Dashboard</h1>
                </header>

                <div className="p-8 max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
