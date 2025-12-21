'use client';

import { useState, useMemo } from 'react';
import EntityFilterTabs, { EntityTypeFilter } from '@/components/admin/entity-filter-tabs';
import KPICards from '@/components/admin/kpi-cards';
import OrganizationListTable from '@/components/admin/organization-list-table';

interface Organization {
    id: string;
    name: string;
    entity_type: string;
    plan: string;
    created_at: string;
    last_login?: string;
    member_count?: number;
}

interface EntityBreakdown {
    social_welfare: number;
    npo: number;
    medical_corp: number;
    general_inc?: number;
}

interface UnifiedDashboardClientProps {
    organizations: Organization[];
    entityBreakdown: EntityBreakdown;
    totalUsers: number;
}

export default function UnifiedDashboardClient({
    organizations,
    entityBreakdown,
    totalUsers,
}: UnifiedDashboardClientProps) {
    const [filter, setFilter] = useState<EntityTypeFilter>('all');

    // Filter organizations based on selected entity type
    const filteredOrganizations = useMemo(() => {
        if (filter === 'all') return organizations;
        return organizations.filter(org => org.entity_type === filter);
    }, [organizations, filter]);

    // Calculate counts for filter tabs
    const counts = {
        all: organizations.length,
        social_welfare: entityBreakdown.social_welfare,
        npo: entityBreakdown.npo,
        medical_corp: entityBreakdown.medical_corp,
    };

    // Calculate filtered KPI
    const filteredEntityBreakdown = useMemo(() => {
        if (filter === 'all') return entityBreakdown;
        return {
            social_welfare: filter === 'social_welfare' ? entityBreakdown.social_welfare : 0,
            npo: filter === 'npo' ? entityBreakdown.npo : 0,
            medical_corp: filter === 'medical_corp' ? entityBreakdown.medical_corp : 0,
        };
    }, [filter, entityBreakdown]);

    const filteredTotalUsers = useMemo(() => {
        if (filter === 'all') return totalUsers;
        return filteredOrganizations.reduce((sum, org) => sum + (org.member_count || 0), 0);
    }, [filter, filteredOrganizations, totalUsers]);

    const handleImpersonate = async (orgId: string) => {
        // TODO: Implement impersonation logic
        // This would typically:
        // 1. Create a temporary session for the target org
        // 2. Redirect to the org's dashboard
        alert(`代理ログイン機能は実装中です。対象法人ID: ${orgId}`);
    };

    return (
        <div className="space-y-6">
            {/* Entity Type Filter */}
            <EntityFilterTabs
                value={filter}
                onChange={setFilter}
                counts={counts}
            />

            {/* KPI Cards */}
            <KPICards
                totalOrganizations={filteredOrganizations.length}
                totalUsers={filteredTotalUsers}
                entityBreakdown={filteredEntityBreakdown}
                monthlyRevenue={980000} // TODO: Fetch from billing data
            />

            {/* Organization List */}
            <div>
                <h2 className="text-lg font-bold text-gray-900 mb-3">
                    法人一覧
                    <span className="ml-2 text-sm font-normal text-gray-500">
                        ({filteredOrganizations.length}件)
                    </span>
                </h2>
                <OrganizationListTable
                    organizations={filteredOrganizations}
                    onImpersonate={handleImpersonate}
                />
            </div>
        </div>
    );
}
