'use client';

import { useState } from 'react';
import { Users, Edit2, Calendar, Phone, Mail, Building2 } from 'lucide-react';

interface Officer {
    id: string;
    name: string;
    role: string;
    term_start?: string;
    term_end?: string;
    email?: string;
    phone?: string;
    is_representative?: boolean;
}

interface OfficerListCanvasProps {
    officers: Officer[];
    onEdit?: (officer: Officer) => void;
}

const ROLE_COLORS: Record<string, string> = {
    '理事長': 'bg-amber-100 text-amber-800 border-amber-200',
    '理事': 'bg-blue-100 text-blue-800 border-blue-200',
    '監事': 'bg-purple-100 text-purple-800 border-purple-200',
    '評議員': 'bg-green-100 text-green-800 border-green-200',
};

export default function OfficerListCanvas({ officers, onEdit }: OfficerListCanvasProps) {
    const [selectedOfficer, setSelectedOfficer] = useState<Officer | null>(null);

    const groupedOfficers = officers.reduce((acc, officer) => {
        const role = officer.role || 'その他';
        if (!acc[role]) acc[role] = [];
        acc[role].push(officer);
        return acc;
    }, {} as Record<string, Officer[]>);

    const roleOrder = ['理事長', '理事', '監事', '評議員', 'その他'];
    const sortedRoles = roleOrder.filter(role => groupedOfficers[role]);

    return (
        <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-4 gap-3">
                {sortedRoles.map(role => (
                    <div key={role} className="bg-gray-50 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-gray-900">
                            {groupedOfficers[role].length}
                        </div>
                        <div className="text-xs text-gray-500">{role}</div>
                    </div>
                ))}
            </div>

            {/* Officer List by Role */}
            <div className="space-y-4">
                {sortedRoles.map(role => (
                    <div key={role}>
                        <h3 className="text-sm font-semibold text-gray-600 mb-2 flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            {role}
                            <span className="text-gray-400">({groupedOfficers[role].length}名)</span>
                        </h3>
                        <div className="grid gap-2">
                            {groupedOfficers[role].map(officer => (
                                <div
                                    key={officer.id}
                                    onClick={() => setSelectedOfficer(selectedOfficer?.id === officer.id ? null : officer)}
                                    className={`p-3 rounded-lg border cursor-pointer transition-all ${selectedOfficer?.id === officer.id
                                            ? 'bg-indigo-50 border-indigo-200 shadow-sm'
                                            : 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm'
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-gray-600 font-bold">
                                                {officer.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-medium text-gray-900">
                                                    {officer.name}
                                                    {officer.is_representative && (
                                                        <span className="ml-2 text-xs text-amber-600">代表</span>
                                                    )}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    任期: {officer.term_end ? new Date(officer.term_end).toLocaleDateString('ja-JP') : '未設定'}
                                                </div>
                                            </div>
                                        </div>
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${ROLE_COLORS[role] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                                            {role}
                                        </span>
                                    </div>

                                    {/* Expanded Details */}
                                    {selectedOfficer?.id === officer.id && (
                                        <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 gap-2 text-sm">
                                            {officer.email && (
                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <Mail className="h-3 w-3" />
                                                    {officer.email}
                                                </div>
                                            )}
                                            {officer.phone && (
                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <Phone className="h-3 w-3" />
                                                    {officer.phone}
                                                </div>
                                            )}
                                            {onEdit && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onEdit(officer);
                                                    }}
                                                    className="col-span-2 mt-2 flex items-center justify-center gap-1 px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-md hover:bg-indigo-700 transition-colors"
                                                >
                                                    <Edit2 className="h-3 w-3" />
                                                    編集
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {officers.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>役員が登録されていません</p>
                    <p className="text-sm mt-1">「役員を追加して」と話しかけてください</p>
                </div>
            )}
        </div>
    );
}
