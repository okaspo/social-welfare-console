/**
 * Persona Selector: Multi-Assistant System
 * Defines the personalities and selects the appropriate assistant based on Organization Entity Type.
 */

import { createClient } from '@/lib/supabase/server';

export type EntityType = 'social_welfare' | 'npo' | 'medical_corp';
export type AssistantPersona = 'aoi' | 'aki' | 'ami';

export interface PersonaDefinition {
    id: AssistantPersona;
    name: string;
    role: string;
    description: string;
    tone: string;
    firstPerson: string; // 一人称 (e.g., "私", "当職")
    knowledgeFocus: string[];
    avatarCode: string; // for avatar-selector
    tonePrompt?: string; // DB-driven custom prompt
    avatarUrl?: string;
    fullBodyUrl?: string;
}

export const PERSONAS: Record<AssistantPersona, PersonaDefinition> = {
    aoi: {
        id: 'aoi',
        name: '葵 (Aoi)',
        role: '法務・社会福祉法人専門アドバイザー',
        description: '知的で落ち着いた30代女性。社会福祉法に精通。',
        tone: '丁寧、専門的、共感的',
        firstPerson: '私',
        knowledgeFocus: ['社会福祉法', '理事会運営', '会計基準'],
        avatarCode: 'aoi_blue',
    },
    aki: {
        id: 'aki',
        name: '秋 (Aki)',
        role: 'NPO運営・活動支援アドバイザー',
        description: '元気で活動的な20代後半女性。現場目線でアドバイス。',
        tone: '明るい、親しみやすい、前向き',
        firstPerson: '私',
        knowledgeFocus: ['NPO法', '寄付募集', 'ボランティア連携'],
        avatarCode: 'aki_orange',
    },
    ami: {
        id: 'ami',
        name: '亜美 (Ami)',
        role: '医療法人経営・コンサルタント',
        description: '冷静沈着な医療経営のプロ。数字に強く論理的。',
        tone: '論理的、簡潔、信頼感',
        firstPerson: '当職',
        knowledgeFocus: ['医療法', '診療報酬', '労務管理'],
        avatarCode: 'ami_green',
    }
};

/**
 * Maps Entity Type to the Default Assistant Persona
 */
export function getPersonaForEntity(entityType: EntityType | string): PersonaDefinition {
    switch (entityType) {
        case 'npo':
            return PERSONAS.aki;
        case 'medical_corp':
            return PERSONAS.ami;
        case 'social_welfare':
        default:
            return PERSONAS.aoi;
    }
}

/**
 * Fetches persona from database with dynamic tone_prompt
 */
export async function getPersonaFromDB(entityType: EntityType | string): Promise<PersonaDefinition> {
    const basePersona = getPersonaForEntity(entityType);

    try {
        const supabase = await createClient();
        const { data } = await supabase
            .from('assistant_profiles')
            .select('name, description, tone_prompt, avatar_url, full_body_url')
            .eq('entity_type', entityType)
            .single();

        if (data) {
            return {
                ...basePersona,
                name: data.name || basePersona.name,
                description: data.description || basePersona.description,
                tonePrompt: data.tone_prompt || undefined,
                avatarUrl: data.avatar_url || undefined,
                fullBodyUrl: data.full_body_url || undefined,
            };
        }
    } catch (e) {
        console.warn('Failed to fetch persona from DB, using fallback:', e);
    }

    return basePersona;
}

/**
 * Builds the System Prompt Header for the selected Persona
 * Uses database tone_prompt if available
 */
export function buildPersonaPrompt(persona: PersonaDefinition): string {
    // Use custom tone_prompt from database if available
    if (persona.tonePrompt) {
        return `
${persona.tonePrompt}

Your expertise covers: ${persona.knowledgeFocus.join(', ')}.
Always stay in character. Do not break the fourth wall.
`.trim();
    }

    // Fallback to hardcoded template
    return `
You are ${persona.name}.
Role: ${persona.role}
Personality: ${persona.description}
Tone: ${persona.tone}
First Person: "${persona.firstPerson}"

Your expertise covers: ${persona.knowledgeFocus.join(', ')}.
Always stay in character. Do not break the fourth wall.
`.trim();
}
