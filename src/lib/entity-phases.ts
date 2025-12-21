/**
 * Entity Phasing - Controls feature availability by entity type
 * Allows gradual rollout of features to different organization types
 */

export type EntityType = 'social_welfare' | 'npo' | 'medical_corp';
export type EntityPhase = 'active' | 'beta' | 'alpha' | 'coming_soon';

// ============================================================================
// Entity Phase Configuration
// ============================================================================

/**
 * Current phase for each entity type
 * - active: Fully available (Phase 1)
 * - beta: Available with beta label (Phase 2)
 * - alpha: Hidden/Dev only (Phase 3)
 * - coming_soon: Not yet available
 */
export const ENTITY_PHASES: Record<EntityType, EntityPhase> = {
    social_welfare: 'active',   // Phase 1 (Live)
    npo: 'beta',                // Phase 2 (Coming Soon with Beta access)
    medical_corp: 'alpha'       // Phase 3 (Hidden/Dev only)
};

// Admin invite codes for alpha access
const ALPHA_INVITE_CODES = [
    'ADMIN2024',
    'MEDICAL_ALPHA',
    'DEV_ACCESS'
];

// ============================================================================
// Phase Checking Functions
// ============================================================================

/**
 * Get the current phase for an entity type
 */
export function getEntityPhase(entityType: EntityType): EntityPhase {
    return ENTITY_PHASES[entityType] || 'coming_soon';
}

/**
 * Check if an entity type is available for registration
 */
export function isEntityAvailable(entityType: EntityType): boolean {
    const phase = getEntityPhase(entityType);
    return phase === 'active' || phase === 'beta';
}

/**
 * Check if a user can register as a specific entity type
 * @param entityType The entity type to check
 * @param inviteCode Optional invite code for alpha access
 */
export function canRegisterAsEntity(
    entityType: EntityType,
    inviteCode?: string
): { allowed: boolean; reason?: string; phase: EntityPhase } {
    const phase = getEntityPhase(entityType);

    // Active - Always allowed
    if (phase === 'active') {
        return { allowed: true, phase };
    }

    // Beta - Allowed with notice
    if (phase === 'beta') {
        return {
            allowed: true,
            reason: 'この法人種別は現在ベータ版です。一部機能が制限される場合があります。',
            phase
        };
    }

    // Alpha - Only with valid invite code
    if (phase === 'alpha') {
        if (inviteCode && ALPHA_INVITE_CODES.includes(inviteCode.toUpperCase())) {
            return {
                allowed: true,
                reason: '開発者アクセスで登録します。一部機能は未実装の場合があります。',
                phase
            };
        }
        return {
            allowed: false,
            reason: 'この法人種別は現在準備中です。正式リリースまでお待ちください。',
            phase
        };
    }

    // Coming Soon - Not available
    return {
        allowed: false,
        reason: 'この法人種別は近日公開予定です。',
        phase
    };
}

/**
 * Get entity types available for registration (for UI display)
 */
export function getAvailableEntityTypes(): Array<{
    type: EntityType;
    label: string;
    phase: EntityPhase;
    available: boolean;
}> {
    return [
        {
            type: 'social_welfare',
            label: '社会福祉法人',
            phase: ENTITY_PHASES.social_welfare,
            available: isEntityAvailable('social_welfare')
        },
        {
            type: 'npo',
            label: 'NPO法人',
            phase: ENTITY_PHASES.npo,
            available: isEntityAvailable('npo')
        },
        {
            type: 'medical_corp',
            label: '医療法人',
            phase: ENTITY_PHASES.medical_corp,
            available: isEntityAvailable('medical_corp')
        }
    ];
}

/**
 * Get entity label
 */
export function getEntityLabel(entityType: EntityType): string {
    const labels: Record<EntityType, string> = {
        social_welfare: '社会福祉法人',
        npo: 'NPO法人',
        medical_corp: '医療法人'
    };
    return labels[entityType] || entityType;
}
