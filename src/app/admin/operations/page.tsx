import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { LayoutDashboard } from 'lucide-react';
import UnifiedDashboardClient from './unified-dashboard-client';

interface Organization {
    id: string;
    name: string;
    entity_type: string;
    plan: string;
    created_at: string;
    last_login?: string;
    member_count?: number;
}

export default async function UnifiedOperationsDashboard() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Check if user is admin
    const { data: adminRole } = await supabase
        .from('admin_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

    if (!adminRole || (adminRole.role !== 'super_admin' && adminRole.role !== 'admin')) {
        redirect('/swc/dashboard');
    }

    // Fetch all organizations with member count
    const { data: organizations, error } = await supabase
        .from('organizations')
        .select(`
            id,
            name,
            entity_type,
            plan,
            created_at
        `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching organizations:', error);
    }

    // Get member counts for each organization
    const orgIds = organizations?.map(o => o.id) || [];
    const { data: memberCounts } = await supabase
        .from('profiles')
        .select('organization_id')
        .in('organization_id', orgIds);

    // Count members per organization
    const countByOrg: Record<string, number> = {};
    memberCounts?.forEach(m => {
        countByOrg[m.organization_id] = (countByOrg[m.organization_id] || 0) + 1;
    });

    // Transform organizations with member counts
    const orgsWithCounts: Organization[] = (organizations || []).map(org => ({
        ...org,
        entity_type: org.entity_type || 'social_welfare',
        member_count: countByOrg[org.id] || 0
    }));

    // Calculate entity breakdown
    const entityBreakdown = {
        social_welfare: orgsWithCounts.filter(o => o.entity_type === 'social_welfare').length,
        npo: orgsWithCounts.filter(o => o.entity_type === 'npo').length,
        medical_corp: orgsWithCounts.filter(o => o.entity_type === 'medical_corp').length,
        general_inc: orgsWithCounts.filter(o => o.entity_type === 'general_inc').length,
    };

    const totalUsers = Object.values(countByOrg).reduce((sum, count) => sum + count, 0);

    return (
        <div className="max-w-7xl mx-auto space-y-6 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <LayoutDashboard className="h-6 w-6 text-indigo-600" />
                        統合運営ダッシュボード
                    </h1>
                    <p className="text-gray-500 mt-1">
                        全法人種別の顧客を一元管理
                    </p>
                </div>
            </div>

            {/* Client-side Interactive Dashboard */}
            <UnifiedDashboardClient
                organizations={orgsWithCounts}
                entityBreakdown={entityBreakdown}
                totalUsers={totalUsers}
            />
        </div>
    );
}
