'use client';

import { useState } from 'react';
import { MessageCircle, FolderOpen, FileText, Settings, LogOut, ChevronLeft, ChevronRight, User, Building2 } from 'lucide-react';
import Link from 'next/link';

export type NavItem = 'home' | 'registry' | 'archive' | 'settings';

interface MinimalSidebarProps {
    activeItem: NavItem;
    onNavClick: (item: NavItem) => void;
    personaEmoji?: string;
    personaName?: string;
    userName?: string;
    corporationName?: string;
}

const NAV_ITEMS = [
    {
        id: 'home' as NavItem,
        icon: MessageCircle,
        label: 'ホーム',
        description: 'AIとチャット'
    },
    {
        id: 'registry' as NavItem,
        icon: FolderOpen,
        label: '台帳',
        description: '役員・定款'
    },
    {
        id: 'archive' as NavItem,
        icon: FileText,
        label: '文書',
        description: '議事録・書類'
    },
    {
        id: 'settings' as NavItem,
        icon: Settings,
        label: '設定',
        description: '法人情報・プラン'
    },
];

export default function MinimalSidebar({
    activeItem,
    onNavClick,
    personaEmoji = '💙',
    personaName = '葵',
    userName,
    corporationName
}: MinimalSidebarProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div
            className={`
                h-full flex flex-col bg-gray-900 text-white transition-all duration-300
                ${isExpanded ? 'w-56' : 'w-16'}
            `}
            onMouseEnter={() => setIsExpanded(true)}
            onMouseLeave={() => setIsExpanded(false)}
        >
            {/* Logo / Persona */}
            <div className="flex-shrink-0 p-3 border-b border-gray-800">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xl shadow-lg flex-shrink-0">
                        {personaEmoji}
                    </div>
                    {isExpanded && (
                        <div className="overflow-hidden">
                            <div className="font-bold text-sm truncate">{personaName}</div>
                            <div className="text-xs text-gray-400 truncate">S級AI事務局</div>
                        </div>
                    )}
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-4">
                <ul className="space-y-1 px-2">
                    {NAV_ITEMS.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeItem === item.id;

                        return (
                            <li key={item.id}>
                                <button
                                    onClick={() => onNavClick(item.id)}
                                    className={`
                                        w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all
                                        ${isActive
                                            ? 'bg-indigo-600 text-white shadow-md'
                                            : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                        }
                                    `}
                                    title={!isExpanded ? item.label : undefined}
                                >
                                    <Icon className="h-5 w-5 flex-shrink-0" />
                                    {isExpanded && (
                                        <div className="text-left overflow-hidden">
                                            <div className="text-sm font-medium truncate">{item.label}</div>
                                            <div className={`text-xs truncate ${isActive ? 'text-indigo-200' : 'text-gray-500'}`}>
                                                {item.description}
                                            </div>
                                        </div>
                                    )}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            {/* User Info & Logout */}
            <div className="flex-shrink-0 p-3 border-t border-gray-800">
                {isExpanded ? (
                    <div className="space-y-3">
                        {/* Corporation Info */}
                        {corporationName && (
                            <div className="flex items-center gap-2 text-xs text-gray-400">
                                <Building2 className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate">{corporationName}</span>
                            </div>
                        )}
                        {/* User Info */}
                        {userName && (
                            <div className="flex items-center gap-2 text-xs text-gray-400">
                                <User className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate">{userName}</span>
                            </div>
                        )}
                        {/* Logout Link */}
                        <Link
                            href="/logout"
                            className="flex items-center gap-2 text-xs text-gray-500 hover:text-red-400 transition-colors"
                        >
                            <LogOut className="h-3 w-3" />
                            ログアウト
                        </Link>
                    </div>
                ) : (
                    <button
                        className="w-full flex justify-center p-2 text-gray-500 hover:text-gray-300"
                        title="ログアウト"
                    >
                        <LogOut className="h-4 w-4" />
                    </button>
                )}
            </div>

            {/* Expand Toggle (Mobile) */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="lg:hidden absolute top-1/2 -right-3 w-6 h-12 bg-gray-800 rounded-r-lg flex items-center justify-center text-gray-400 hover:text-white"
            >
                {isExpanded ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
        </div>
    );
}
