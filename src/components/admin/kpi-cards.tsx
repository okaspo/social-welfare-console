'use client';

import { Building2, Users, TrendingUp, CreditCard, Heart, Stethoscope } from 'lucide-react';

interface EntityBreakdown {
    social_welfare: number;
    npo: number;
    medical_corp: number;
    general_inc?: number;
}

interface KPICardsProps {
    totalOrganizations: number;
    totalUsers: number;
    monthlyRevenue?: number;
    entityBreakdown: EntityBreakdown;
}

export default function KPICards({ totalOrganizations, totalUsers, monthlyRevenue, entityBreakdown }: KPICardsProps) {
    const total = entityBreakdown.social_welfare + entityBreakdown.npo + entityBreakdown.medical_corp + (entityBreakdown.general_inc || 0);

    const getPercentage = (value: number) => total > 0 ? Math.round((value / total) * 100) : 0;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Organizations */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-500 font-medium">総法人数</p>
                        <p className="text-3xl font-bold text-gray-900 mt-1">{totalOrganizations}</p>
                    </div>
                    <div className="p-3 bg-indigo-50 rounded-xl">
                        <Building2 className="h-6 w-6 text-indigo-600" />
                    </div>
                </div>

                {/* Entity Breakdown Bar */}
                <div className="mt-4">
                    <div className="flex h-2 rounded-full overflow-hidden bg-gray-100">
                        <div
                            className="bg-blue-500 transition-all"
                            style={{ width: `${getPercentage(entityBreakdown.social_welfare)}%` }}
                        />
                        <div
                            className="bg-orange-500 transition-all"
                            style={{ width: `${getPercentage(entityBreakdown.npo)}%` }}
                        />
                        <div
                            className="bg-green-500 transition-all"
                            style={{ width: `${getPercentage(entityBreakdown.medical_corp)}%` }}
                        />
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-blue-500" />
                            社福 {entityBreakdown.social_welfare}
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-orange-500" />
                            NPO {entityBreakdown.npo}
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-green-500" />
                            医療 {entityBreakdown.medical_corp}
                        </span>
                    </div>
                </div>
            </div>

            {/* Total Users */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-500 font-medium">総ユーザー数</p>
                        <p className="text-3xl font-bold text-gray-900 mt-1">{totalUsers}</p>
                    </div>
                    <div className="p-3 bg-emerald-50 rounded-xl">
                        <Users className="h-6 w-6 text-emerald-600" />
                    </div>
                </div>
                <p className="text-xs text-gray-500 mt-4">
                    平均 <span className="font-bold text-gray-900">{totalOrganizations > 0 ? (totalUsers / totalOrganizations).toFixed(1) : 0}</span> 名/法人
                </p>
            </div>

            {/* Monthly Revenue */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-500 font-medium">月間売上</p>
                        <p className="text-3xl font-bold text-gray-900 mt-1">
                            ¥{(monthlyRevenue || 0).toLocaleString()}
                        </p>
                    </div>
                    <div className="p-3 bg-amber-50 rounded-xl">
                        <CreditCard className="h-6 w-6 text-amber-600" />
                    </div>
                </div>
                <p className="text-xs text-gray-500 mt-4">
                    前月比 <span className="font-bold text-emerald-600">+5.2%</span>
                </p>
            </div>

            {/* Entity Type Distribution */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-3">
                    <p className="text-sm text-gray-500 font-medium">種別構成比</p>
                    <TrendingUp className="h-4 w-4 text-gray-400" />
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2 text-sm">
                            <Heart className="h-4 w-4 text-blue-600" />
                            社会福祉法人
                        </span>
                        <span className="font-bold text-gray-900">{getPercentage(entityBreakdown.social_welfare)}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2 text-sm">
                            <Users className="h-4 w-4 text-orange-600" />
                            NPO法人
                        </span>
                        <span className="font-bold text-gray-900">{getPercentage(entityBreakdown.npo)}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2 text-sm">
                            <Stethoscope className="h-4 w-4 text-green-600" />
                            医療法人
                        </span>
                        <span className="font-bold text-gray-900">{getPercentage(entityBreakdown.medical_corp)}%</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
