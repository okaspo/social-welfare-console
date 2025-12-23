import { createClient } from '@/lib/supabase/server';
import { getEntityTypeFromPath, EntityType } from './admin-scope';

// ============================================================================
// Types
// ============================================================================

export interface ScopedQueryOptions {
    /** Current pathname for scope detection */
    pathname: string;
    /** Override entity type filtering */
    forceEntityType?: EntityType;
    /** Skip entity type filtering entirely */
    skipFilter?: boolean;
}

// ============================================================================
// Scoped Query Builders
// ============================================================================

/**
 * Get organizations with automatic entity_type scoping
 */
export async function getScopedOrganizations(options: ScopedQueryOptions) {
    const supabase = await createClient();
    const entityType = options.forceEntityType ?? getEntityTypeFromPath(options.pathname);

    let query = supabase
        .from('organizations')
        .select(`
            id,
            name,
            plan,
            entity_type,
            created_at,
            profiles (
                id
            )
        `)
        .order('created_at', { ascending: false });

    // Apply scope filter unless global view
    if (entityType && !options.skipFilter) {
        query = query.eq('entity_type', entityType);
    }

    const { data, error } = await query;

    if (error) {
        console.error('getScopedOrganizations error:', error);
        return [];
    }

    return data || [];
}

/**
 * Get knowledge items with automatic entity_type scoping
 */
export async function getScopedKnowledge(options: ScopedQueryOptions) {
    const supabase = await createClient();
    const entityType = options.forceEntityType ?? getEntityTypeFromPath(options.pathname);

    let query = supabase
        .from('common_knowledge')
        .select('*')
        .eq('is_active', true)
        .order('updated_at', { ascending: false });

    // Apply scope filter - include 'common' and entity-specific
    if (entityType && !options.skipFilter) {
        query = query.or(`entity_type.eq.common,entity_type.eq.${entityType}`);
    }

    const { data, error } = await query;

    if (error) {
        console.error('getScopedKnowledge error:', error);
        return [];
    }

    return data || [];
}

/**
 * Get users/profiles with automatic entity_type scoping (via organization)
 */
export async function getScopedUsers(options: ScopedQueryOptions) {
    const supabase = await createClient();
    const entityType = options.forceEntityType ?? getEntityTypeFromPath(options.pathname);

    let query = supabase
        .from('profiles')
        .select(`
            id,
            full_name,
            email,
            role,
            corporation_name,
            organization_id,
            organizations!organization_id (
                id,
                name,
                entity_type,
                plan
            )
        `)
        .order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
        console.error('getScopedUsers error:', error);
        return [];
    }

    // Filter by entity_type on the client side (organization relationship)
    if (entityType && !options.skipFilter && data) {
        return data.filter((user: any) => {
            const org = Array.isArray(user.organizations)
                ? user.organizations[0]
                : user.organizations;
            return org?.entity_type === entityType;
        });
    }

    return data || [];
}

/**
 * Get plan limits with entity_type scoping
 */
export async function getScopedPlanLimits(options: ScopedQueryOptions) {
    const supabase = await createClient();
    const entityType = options.forceEntityType ?? getEntityTypeFromPath(options.pathname);

    let query = supabase
        .from('plan_limits')
        .select('*')
        .order('plan_id');

    // Plans can be filtered by target_entity_type if available
    if (entityType && !options.skipFilter) {
        query = query.or(`target_entity_type.is.null,target_entity_type.eq.${entityType}`);
    }

    const { data, error } = await query;

    if (error) {
        console.error('getScopedPlanLimits error:', error);
        return [];
    }

    return data || [];
}

// ============================================================================
// Dashboard Stats
// ============================================================================

/**
 * Get dashboard statistics with scoping
 */
export async function getScopedDashboardStats(options: ScopedQueryOptions) {
    const supabase = await createClient();
    const entityType = options.forceEntityType ?? getEntityTypeFromPath(options.pathname);

    // Organizations count
    let orgQuery = supabase
        .from('organizations')
        .select('id', { count: 'exact', head: true });

    if (entityType && !options.skipFilter) {
        orgQuery = orgQuery.eq('entity_type', entityType);
    }

    const { count: orgCount } = await orgQuery;

    // Users count (via organizations)
    const users = await getScopedUsers(options);
    const userCount = users.length;

    // Monthly revenue (placeholder - would need billing data)
    const monthlyRevenue = 0;

    return {
        organizationCount: orgCount || 0,
        userCount,
        monthlyRevenue,
        entityType,
        scopeName: entityType
            ? (entityType === 'social_welfare' ? '社会福祉法人' :
                entityType === 'npo' ? 'NPO法人' : '医療法人')
            : '全体'
    };
}
