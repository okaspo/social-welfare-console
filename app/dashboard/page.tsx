import { Button } from "@/components/ui/button";
import { CalendarDays, AlertCircle, FileText, ArrowUpRight } from "lucide-react";
import { AoiChat } from "@/components/chat/aoi-chat";

export default function DashboardPage() {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Welcome Section */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Overview</h2>
                    <p className="text-muted-foreground">
                        Welcome back to your governance cockpit.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">Download Report</Button>
                    <Button>New Meeting</Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[
                    { label: "Pending Approvals", value: "3", icon: AlertCircle, color: "text-orange-500" },
                    { label: "Upcoming Meetings", value: "2", icon: CalendarDays, color: "text-blue-500" },
                    { label: "Documents Stored", value: "128", icon: FileText, color: "text-purple-500" },
                    { label: "AI Usage", value: "85%", icon: ArrowUpRight, color: "text-green-500" },
                ].map((stat, i) => (
                    <div key={i} className="glass-card p-6 flex flex-col justify-between h-32">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-muted-foreground">{stat.label}</span>
                            <stat.icon className={`h-4 w-4 ${stat.color}`} />
                        </div>
                        <div className="text-2xl font-bold">{stat.value}</div>
                    </div>
                ))}
            </div>

            {/* Aoi Chat Interface */}
            <div className="w-full">
                <AoiChat />
            </div>

            {/* Recent Activity / Content */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <div className="col-span-4 glass-card p-6">
                    <h3 className="font-semibold mb-4">Board Meeting Schedule</h3>
                    <div className="h-[200px] flex items-center justify-center text-muted-foreground bg-muted/20 rounded-lg border border-dashed text-sm">
                        Calendar Widget Placeholder
                    </div>
                </div>
                <div className="col-span-3 glass-card p-6">
                    <h3 className="font-semibold mb-4">AI Insight</h3>
                    <div className="bg-primary/5 p-4 rounded-lg border border-primary/10">
                        <p className="text-sm text-primary font-medium mb-2">Term Expiry Alert</p>
                        <p className="text-sm text-muted-foreground">
                            Director <strong>Kenji Sato</strong>'s term expires in 30 days.
                            The AI has prepared a draft agenda for the re-election.
                        </p>
                        <Button variant="link" className="px-0 mt-2 h-auto text-xs">
                            View Draft Agenda &rarr;
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
