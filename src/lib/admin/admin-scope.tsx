'use client';

import { createContext, useContext, ReactNode, useMemo } from 'react';
import { usePathname } from 'next/navigation';

// ============================================================================
// Types
// ============================================================================

export type AdminConsoleType = 'swc' | 'npo' | 'med' | 'global';
export type EntityType = 'social_welfare' | 'npo' | 'medical_corp' | null;

interface AdminScopeContextValue {
    /** Current console type (swc, npo, med, global) */
    console: AdminConsoleType;
    /** Entity type for database filtering */
    entityType: EntityType;
    /** Display name for current scope */
    scopeName: string;
    /** Whether this is a global (unscoped) view */
    isGlobal: boolean;
    /** Get scoped filter for Supabase queries */
    getScopeFilter: () => { entity_type: EntityType } | null;
}

// ============================================================================
// Context
// ============================================================================

const AdminScopeContext = createContext<AdminScopeContextValue | null>(null);

// ============================================================================
// Console to EntityType Mapping
// ============================================================================

const CONSOLE_ENTITY_MAP: Record<AdminConsoleType, EntityType> = {
    swc: 'social_welfare',
    npo: 'npo',
    med: 'medical_corp',
    global: null
};

const CONSOLE_NAMES: Record<AdminConsoleType, string> = {
    swc: '社会福祉法人',
    npo: 'NPO法人',
    med: '医療法人',
    global: '統合ビュー'
};

// ============================================================================
// Provider
// ============================================================================

interface AdminScopeProviderProps {
    children: ReactNode;
    /** Override console type (useful for testing) */
    forceConsole?: AdminConsoleType;
}

export function AdminScopeProvider({ children, forceConsole }: AdminScopeProviderProps) {
    const pathname = usePathname();

    const value = useMemo<AdminScopeContextValue>(() => {
        // Determine console from pathname
        let console: AdminConsoleType = 'global';

        if (forceConsole) {
            console = forceConsole;
        } else if (pathname.startsWith('/admin/swc')) {
            console = 'swc';
        } else if (pathname.startsWith('/admin/npo')) {
            console = 'npo';
        } else if (pathname.startsWith('/admin/med')) {
            console = 'med';
        } else if (pathname.startsWith('/admin/global')) {
            console = 'global';
        }

        const entityType = CONSOLE_ENTITY_MAP[console];
        const scopeName = CONSOLE_NAMES[console];
        const isGlobal = console === 'global';

        return {
            console,
            entityType,
            scopeName,
            isGlobal,
            getScopeFilter: () => {
                if (isGlobal || !entityType) return null;
                return { entity_type: entityType };
            }
        };
    }, [pathname, forceConsole]);

    return (
        <AdminScopeContext.Provider value={value}>
            {children}
        </AdminScopeContext.Provider>
    );
}

// ============================================================================
// Hook
// ============================================================================

export function useAdminScope(): AdminScopeContextValue {
    const context = useContext(AdminScopeContext);

    if (!context) {
        // Fallback for components not wrapped in provider
        // Derive from window location if available
        if (typeof window !== 'undefined') {
            const pathname = window.location.pathname;
            let console: AdminConsoleType = 'global';

            if (pathname.startsWith('/admin/swc')) console = 'swc';
            else if (pathname.startsWith('/admin/npo')) console = 'npo';
            else if (pathname.startsWith('/admin/med')) console = 'med';

            const entityType = CONSOLE_ENTITY_MAP[console];
            return {
                console,
                entityType,
                scopeName: CONSOLE_NAMES[console],
                isGlobal: console === 'global',
                getScopeFilter: () => entityType ? { entity_type: entityType } : null
            };
        }

        // Default fallback
        return {
            console: 'global',
            entityType: null,
            scopeName: '統合ビュー',
            isGlobal: true,
            getScopeFilter: () => null
        };
    }

    return context;
}

// ============================================================================
// Server-Side Utility
// ============================================================================

/**
 * Get entity type from pathname (for server components)
 */
export function getEntityTypeFromPath(pathname: string): EntityType {
    if (pathname.startsWith('/admin/swc')) return 'social_welfare';
    if (pathname.startsWith('/admin/npo')) return 'npo';
    if (pathname.startsWith('/admin/med')) return 'medical_corp';
    return null;
}

/**
 * Get console type from pathname
 */
export function getConsoleFromPath(pathname: string): AdminConsoleType {
    if (pathname.startsWith('/admin/swc')) return 'swc';
    if (pathname.startsWith('/admin/npo')) return 'npo';
    if (pathname.startsWith('/admin/med')) return 'med';
    if (pathname.startsWith('/admin/global')) return 'global';
    return 'global';
}
