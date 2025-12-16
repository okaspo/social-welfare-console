// Entity Badge Component
// Displays colored badge for entity types in admin UI

import { getEntityConfig, type EntityType } from '@/lib/entity/config';

interface EntityBadgeProps {
    entityType: EntityType;
    size?: 'sm' | 'md';
    className?: string;
}

const ENTITY_COLORS: Record<EntityType, string> = {
    social_welfare: 'bg-blue-100 text-blue-800 border-blue-200',
    medical_corp: 'bg-green-100 text-green-800 border-green-200',
    npo: 'bg-purple-100 text-purple-800 border-purple-200',
    general_inc: 'bg-orange-100 text-orange-800 border-orange-200'
};

export function EntityBadge({
    entityType,
    size = 'md',
    className = ''
}: EntityBadgeProps) {
    const config = getEntityConfig(entityType);

    const sizeClasses = {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-1 text-sm'
    };

    return (
        <span
            className={`
        inline-flex items-center rounded-md font-medium border
        ${ENTITY_COLORS[entityType]} 
        ${sizeClasses[size]}
        ${className}
      `}
        >
            {config.name}
        </span>
    );
}
