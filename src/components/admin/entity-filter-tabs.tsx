'use client';

import { useState } from 'react';
import { Building2, Heart, Stethoscope, Users, LayoutGrid } from 'lucide-react';

export type EntityTypeFilter = 'all' | 'social_welfare' | 'npo' | 'medical_corp';

interface EntityFilterTabsProps {
    value: EntityTypeFilter;
    onChange: (value: EntityTypeFilter) => void;
    counts?: {
        all: number;
        social_welfare: number;
        npo: number;
        medical_corp: number;
    };
}

const ENTITY_OPTIONS: { value: EntityTypeFilter; label: string; icon: React.ReactNode; color: string }[] = [
    { value: 'all', label: 'すべて', icon: <LayoutGrid className="h-4 w-4" />, color: 'bg-gray-100 text-gray-700' },
    { value: 'social_welfare', label: '社会福祉法人', icon: <Heart className="h-4 w-4" />, color: 'bg-blue-100 text-blue-700' },
    { value: 'npo', label: 'NPO法人', icon: <Users className="h-4 w-4" />, color: 'bg-orange-100 text-orange-700' },
    { value: 'medical_corp', label: '医療法人', icon: <Stethoscope className="h-4 w-4" />, color: 'bg-green-100 text-green-700' },
];

export default function EntityFilterTabs({ value, onChange, counts }: EntityFilterTabsProps) {
    return (
        <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
            {ENTITY_OPTIONS.map((option) => {
                const isActive = value === option.value;
                const count = counts?.[option.value];

                return (
                    <button
                        key={option.value}
                        onClick={() => onChange(option.value)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${isActive
                                ? 'bg-white shadow-sm text-gray-900'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                            }`}
                    >
                        <span className={isActive ? '' : 'opacity-60'}>{option.icon}</span>
                        <span>{option.label}</span>
                        {count !== undefined && (
                            <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-bold ${isActive ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-200 text-gray-600'
                                }`}>
                                {count}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}

// Entity Type Badge Component
export function EntityTypeBadge({ type }: { type: string }) {
    const config: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
        social_welfare: { label: '社福', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: <Heart className="h-3 w-3" /> },
        npo: { label: 'NPO', color: 'bg-orange-100 text-orange-700 border-orange-200', icon: <Users className="h-3 w-3" /> },
        medical_corp: { label: '医療', color: 'bg-green-100 text-green-700 border-green-200', icon: <Stethoscope className="h-3 w-3" /> },
        general_inc: { label: '一般社団', color: 'bg-purple-100 text-purple-700 border-purple-200', icon: <Building2 className="h-3 w-3" /> },
    };

    const typeConfig = config[type] || { label: type, color: 'bg-gray-100 text-gray-700 border-gray-200', icon: <Building2 className="h-3 w-3" /> };

    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${typeConfig.color}`}>
            {typeConfig.icon}
            {typeConfig.label}
        </span>
    );
}
