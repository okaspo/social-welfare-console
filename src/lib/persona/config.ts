// Persona Configuration System
// Manages AI assistant profiles based on entity type

import { createClient } from '@/lib/supabase/server';
import type { EntityType } from '@/lib/entity/config';

export interface AssistantProfile {
    codeName: string;  // Internal ID (immutable)
    displayName: string;  // User-facing name (editable)
    catchphrase?: string;  // Tagline
    color: string;
    avatar?: string;
    promptSlug: string;
}

const FALLBACK_PROFILE: AssistantProfile = {
    codeName: 'aoi',
    displayName: 'AI事務局 葵',
    catchphrase: 'AIアシスタント',
    color: 'blue',
    promptSlug: 'persona_aoi'
};

export async function getAssistantProfile(entityType: EntityType): Promise<AssistantProfile> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('assistant_profiles')
        .select('*')
        .eq('entity_type_key', entityType)
        .single();

    if (error || !data) {
        console.warn(`No assistant profile found for ${entityType}, using fallback`);
        return FALLBACK_PROFILE;
    }

    return {
        codeName: data.code_name,
        displayName: data.display_name,
        catchphrase: data.catchphrase,
        color: data.ui_theme_color,
        avatar: data.avatar_image_url,
        promptSlug: data.personality_prompt_slug
    };
}

export function getAssistantColorClasses(color: string) {
    const colorMap: Record<string, {
        bg: string;
        bgLight: string;
        text: string;
        border: string;
    }> = {
        blue: {
            bg: 'bg-blue-600',
            bgLight: 'bg-blue-50',
            text: 'text-blue-600',
            border: 'border-blue-200'
        },
        orange: {
            bg: 'bg-orange-600',
            bgLight: 'bg-orange-50',
            text: 'text-orange-600',
            border: 'border-orange-200'
        },
        teal: {
            bg: 'bg-teal-600',
            bgLight: 'bg-teal-50',
            text: 'text-teal-600',
            border: 'border-teal-200'
        }
    };

    return colorMap[color] || colorMap.blue;
}
