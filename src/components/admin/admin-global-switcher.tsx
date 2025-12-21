'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronDown, Building2, Heart, Stethoscope, Check } from 'lucide-react';

type ConsoleType = 'swc' | 'npo' | 'med';

interface ConsoleConfig {
    id: ConsoleType;
    name: string;
    fullName: string;
    color: string;
    bgColor: string;
    borderColor: string;
    icon: React.ReactNode;
    path: string;
    phase: 'active' | 'beta' | 'alpha';
}

const CONSOLES: ConsoleConfig[] = [
    {
        id: 'swc',
        name: '社会福祉',
        fullName: '社会福祉法人コンソール',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-600',
        icon: <Building2 className="h-4 w-4" />,
        path: '/admin/swc',
        phase: 'active'
    },
    {
        id: 'npo',
        name: 'NPO',
        fullName: 'NPO法人コンソール',
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-600',
        icon: <Heart className="h-4 w-4" />,
        path: '/admin/npo',
        phase: 'beta'
    },
    {
        id: 'med',
        name: '医療',
        fullName: '医療法人コンソール',
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-50',
        borderColor: 'border-emerald-600',
        icon: <Stethoscope className="h-4 w-4" />,
        path: '/admin/med',
        phase: 'alpha'
    }
];

function getPhaseLabel(phase: string) {
    switch (phase) {
        case 'beta': return <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-bold bg-orange-100 text-orange-700 rounded">BETA</span>;
        case 'alpha': return <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-bold bg-gray-100 text-gray-600 rounded">ALPHA</span>;
        default: return null;
    }
}

export default function AdminGlobalSwitcher() {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();

    // Determine current console from pathname
    const getCurrentConsole = (): ConsoleConfig => {
        if (pathname.startsWith('/admin/npo')) return CONSOLES[1];
        if (pathname.startsWith('/admin/med')) return CONSOLES[2];
        return CONSOLES[0]; // Default to SWC
    };

    const current = getCurrentConsole();

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all
                    ${current.bgColor} ${current.borderColor} ${current.color}
                    hover:shadow-md
                `}
            >
                {current.icon}
                <span className="font-semibold text-sm">{current.name}</span>
                {getPhaseLabel(current.phase)}
                <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Dropdown */}
                    <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-xl shadow-xl border z-50 overflow-hidden">
                        <div className="p-2 border-b bg-gray-50">
                            <p className="text-xs text-gray-500 font-medium">コンソールを切り替え</p>
                        </div>
                        <div className="p-2">
                            {CONSOLES.map((console) => {
                                const isActive = current.id === console.id;
                                return (
                                    <Link
                                        key={console.id}
                                        href={console.path}
                                        onClick={() => setIsOpen(false)}
                                        className={`
                                            flex items-center justify-between p-3 rounded-lg transition-all
                                            ${isActive ? `${console.bgColor} ${console.borderColor} border-2` : 'hover:bg-gray-50 border-2 border-transparent'}
                                        `}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${console.bgColor} ${console.color}`}>
                                                {console.icon}
                                            </div>
                                            <div>
                                                <div className="flex items-center">
                                                    <span className={`font-medium text-sm ${console.color}`}>
                                                        {console.fullName}
                                                    </span>
                                                    {getPhaseLabel(console.phase)}
                                                </div>
                                            </div>
                                        </div>
                                        {isActive && (
                                            <Check className={`h-5 w-5 ${console.color}`} />
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

export { CONSOLES, type ConsoleType, type ConsoleConfig };
