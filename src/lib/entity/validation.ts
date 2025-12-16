// Entity-Aware Validation
// Business rule validation based on entity type

import { EntityType, getEntityConfig } from './config';

export interface Officer {
    id: string;
    role: string;
    status: string;
}

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}

export function validateOfficerRole(
    entityType: EntityType,
    role: string
): boolean {
    const config = getEntityConfig(entityType);
    return role in config.roles;
}

export function validateOfficers(
    entityType: EntityType,
    officers: Officer[]
): ValidationResult {
    const config = getEntityConfig(entityType);
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check mandatory officers
    for (const mandatoryRole of config.complianceRules.mandatoryOfficers || []) {
        const count = officers.filter(
            o => o.role === mandatoryRole && o.status === 'active'
        ).length;

        if (count === 0) {
            const roleLabel = config.roles[mandatoryRole].label;
            errors.push(`${roleLabel}が登録されていません。`);
        }
    }

    // Check relative ratio (if applicable)
    if (config.complianceRules.relativeRatioLimit) {
        // This would integrate with check_relative_ratio_compliance function
        // For now, just a placeholder
        warnings.push('親族関係要件の確認が必要です。');
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings
    };
}

export function getRequiredRoles(entityType: EntityType): Array<{
    code: string;
    label: string;
}> {
    const config = getEntityConfig(entityType);
    const mandatoryRoles = config.complianceRules.mandatoryOfficers || [];

    return mandatoryRoles.map(code => ({
        code,
        label: config.roles[code].label
    }));
}
