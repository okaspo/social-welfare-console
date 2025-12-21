import { ReactNode } from 'react';
import Link from 'next/link';
import {
    Stethoscope, Users, Building, FileText,
    Settings, BarChart3, Shield, Bell, Scale, Briefcase
} from 'lucide-react';
import AdminGlobalSwitcher from '@/components/admin/admin-global-switcher';

interface MedLayoutProps {
    children: ReactNode;
}

const NAV_ITEMS = [
    { icon: BarChart3, label: 'ダッシュボード', href: '/admin/med' },
    { icon: Users, label: '顧客管理', href: '/admin/med/customers' },
    { icon: Building, label: 'MS法人管理', href: '/admin/med/ms-corp' },
    { icon: FileText, label: '届出管理', href: '/admin/med/filings' },
    { icon: Scale, label: '利益相反', href: '/admin/med/conflicts' },
    { icon: Briefcase, label: '事業承継', href: '/admin/med/succession' },
    { icon: Bell, label: 'フィードバック', href: '/admin/med/feedback' },
    { icon: Settings, label: '設定', href: '/admin/med/settings' },
];

export default function MedLayout({ children }: MedLayoutProps) {
    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r flex flex-col">
                {/* Logo Area */}
                <div className="p-4 border-b">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl">
                            <Stethoscope className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <div className="font-bold text-gray-900 text-sm">医療法人</div>
                            <div className="text-xs text-gray-500 font-medium">ALPHA</div>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4">
                    <ul className="space-y-1">
                        {NAV_ITEMS.map((item) => {
                            const Icon = item.icon;
                            return (
                                <li key={item.href}>
                                    <Link
                                        href={item.href}
                                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                                    >
                                        <Icon className="h-5 w-5" />
                                        <span className="text-sm font-medium">{item.label}</span>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                {/* Back to Hub */}
                <div className="p-4 border-t">
                    <Link
                        href="/admin"
                        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
                    >
                        <Shield className="h-4 w-4" />
                        Admin Hub に戻る
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
                {/* Header */}
                <header className="h-16 bg-white border-b flex items-center justify-between px-6">
                    <div className="flex items-center gap-4">
                        <h1 className="text-lg font-semibold text-gray-900">医療法人コンソール</h1>
                        <span className="px-2 py-1 text-xs font-bold bg-gray-100 text-gray-600 rounded-full">ALPHA</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <AdminGlobalSwitcher />
                    </div>
                </header>

                {/* Content */}
                <main className="flex-1 overflow-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
