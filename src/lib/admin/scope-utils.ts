import { EntityType, AdminConsoleType } from './admin-scope-types';

/**
 * Get entity type from pathname (Universal)
 */
export function getEntityTypeFromPath(pathname: string): EntityType {
    if (pathname.startsWith('/admin/swc')) return 'social_welfare';
    if (pathname.startsWith('/admin/npo')) return 'npo';
    if (pathname.startsWith('/admin/med')) return 'medical_corp';
    return null;
}

/**
 * Get console type from pathname (Universal)
 */
export function getConsoleFromPath(pathname: string): AdminConsoleType {
    if (pathname.startsWith('/admin/swc')) return 'swc';
    if (pathname.startsWith('/admin/npo')) return 'npo';
    if (pathname.startsWith('/admin/med')) return 'med';
    if (pathname.startsWith('/admin/global')) return 'global';
    return 'global';
}
