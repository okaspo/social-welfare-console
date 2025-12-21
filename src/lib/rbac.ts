/**
 * Role-based access control utilities
 * 
 * Defines roles and their permissions for the application
 */

export type UserRole = 'admin' | 'representative' | 'general' | 'auditor'

export interface RolePermissions {
    canEdit: boolean
    canDelete: boolean
    canInviteMembers: boolean
    canViewAuditLogs: boolean
    canAccessFinancials: boolean
    canGenerateDocuments: boolean
    label: string
    description: string
}

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
    admin: {
        canEdit: true,
        canDelete: true,
        canInviteMembers: true,
        canViewAuditLogs: true,
        canAccessFinancials: true,
        canGenerateDocuments: true,
        label: '管理者',
        description: 'すべての機能にアクセスできます'
    },
    representative: {
        canEdit: true,
        canDelete: true,
        canInviteMembers: true,
        canViewAuditLogs: true,
        canAccessFinancials: true,
        canGenerateDocuments: true,
        label: '代表',
        description: '組織の代表者。すべての機能にアクセスできます'
    },
    general: {
        canEdit: true,
        canDelete: false,
        canInviteMembers: false,
        canViewAuditLogs: false,
        canAccessFinancials: false,
        canGenerateDocuments: true,
        label: '一般',
        description: '基本的な閲覧・編集権限'
    },
    auditor: {
        canEdit: false,
        canDelete: false,
        canInviteMembers: false,
        canViewAuditLogs: true,
        canAccessFinancials: true,
        canGenerateDocuments: false,
        label: '監事',
        description: '読み取り専用。監査ログと財務情報を閲覧できます'
    }
}

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: UserRole, permission: keyof RolePermissions): boolean {
    const permissions = ROLE_PERMISSIONS[role]
    if (!permissions) return false

    const value = permissions[permission]
    return typeof value === 'boolean' ? value : false
}

/**
 * Get role label for display
 */
export function getRoleLabel(role: UserRole): string {
    return ROLE_PERMISSIONS[role]?.label || role
}

/**
 * Check if role is read-only
 */
export function isReadOnlyRole(role: UserRole): boolean {
    return role === 'auditor'
}

/**
 * Get available roles for member management dropdown
 */
export function getAvailableRoles(): { value: UserRole; label: string }[] {
    return Object.entries(ROLE_PERMISSIONS).map(([value, permissions]) => ({
        value: value as UserRole,
        label: permissions.label
    }))
}
