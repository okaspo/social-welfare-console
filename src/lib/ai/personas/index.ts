/**
 * Three Sisters AI Personas Index
 * 
 * 法人種別ごとの3つのAI人格を統合管理
 */

import { personaInfo as aoiInfo, systemPrompt as aoiPrompt } from './aoi';
import { personaInfo as akiInfo, systemPrompt as akiPrompt } from './aki';
import { personaInfo as amiInfo, systemPrompt as amiPrompt } from './ami';

export interface PersonaInfo {
    id: string;
    name: string;
    nameRomaji: string;
    role: string;
    entityType: string;
    color: string;
    emoji: string;
}

export interface Persona {
    info: PersonaInfo;
    systemPrompt: string;
}

// Export individual personas
export const aoi: Persona = { info: aoiInfo, systemPrompt: aoiPrompt };
export const aki: Persona = { info: akiInfo, systemPrompt: akiPrompt };
export const ami: Persona = { info: amiInfo, systemPrompt: amiPrompt };

// All personas map
export const personas: Record<string, Persona> = {
    aoi,
    aki,
    ami,
};

// Entity type to persona mapping
export const entityTypeToPersona: Record<string, Persona> = {
    social_welfare: aoi,
    npo: aki,
    medical_corp: ami,
    general_inc: aoi, // Default to Aoi for general incorporated associations
};

/**
 * Get persona by entity type
 */
export function getPersonaByEntityType(entityType: string): Persona {
    return entityTypeToPersona[entityType] || aoi; // Default to Aoi
}

/**
 * Get persona by ID
 */
export function getPersonaById(id: string): Persona | undefined {
    return personas[id];
}

/**
 * Get all personas as an array
 */
export function getAllPersonas(): Persona[] {
    return Object.values(personas);
}

/**
 * Get system prompt for entity type
 */
export function getSystemPromptForEntityType(entityType: string): string {
    const persona = getPersonaByEntityType(entityType);
    return persona.systemPrompt;
}
