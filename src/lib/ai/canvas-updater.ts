'use server';

import { createClient } from '@/lib/supabase/server';

// ============================================================================
// Canvas Update Types
// ============================================================================

export type CanvasFieldType =
    | 'date'           // 日付
    | 'meeting_type'   // 会議種別
    | 'attendees'      // 出席者（配列）
    | 'agenda'         // 議題（配列）
    | 'content'        // 本文
    | 'corporation_name' // 法人名
    | 'title';         // タイトル

export interface CanvasUpdateAction {
    type: 'set' | 'append' | 'remove' | 'clear';
    field: CanvasFieldType;
    value: any;
    timestamp: number;
}

export interface CanvasState {
    fields: Record<CanvasFieldType, any>;
    history: CanvasUpdateAction[];
    isDirty: boolean;
    lastUpdatedBy: 'ai' | 'user';
}

// ============================================================================
// Canvas Update Functions (called by AI tools)
// ============================================================================

/**
 * Update a single field in the canvas
 */
export async function updateCanvasField(
    field: CanvasFieldType,
    value: any,
    action: 'set' | 'append' = 'set'
): Promise<{ success: boolean; message: string; updatedValue: any }> {
    // Validate field
    const validFields: CanvasFieldType[] = [
        'date', 'meeting_type', 'attendees', 'agenda',
        'content', 'corporation_name', 'title'
    ];

    if (!validFields.includes(field)) {
        return {
            success: false,
            message: `無効なフィールド: ${field}`,
            updatedValue: null
        };
    }

    // Format the update for client consumption
    const update: CanvasUpdateAction = {
        type: action,
        field,
        value,
        timestamp: Date.now()
    };

    // Return success with the update action
    // The client will receive this and update the Canvas state
    return {
        success: true,
        message: getUpdateMessage(field, value, action),
        updatedValue: value
    };
}

/**
 * Append to an array field (attendees, agenda)
 */
export async function appendToCanvasField(
    field: 'attendees' | 'agenda',
    items: string[]
): Promise<{ success: boolean; message: string; updatedValue: string[] }> {
    return {
        success: true,
        message: getAppendMessage(field, items),
        updatedValue: items
    };
}

/**
 * Extract structured data from conversation
 */
export async function extractDataFromMessage(
    message: string,
    targetField: CanvasFieldType
): Promise<{ extracted: boolean; value: any; confidence: number }> {
    // Date extraction patterns
    if (targetField === 'date') {
        const today = new Date();
        if (message.includes('今日') || message.includes('本日')) {
            return { extracted: true, value: today.toISOString().split('T')[0], confidence: 0.95 };
        }
        if (message.includes('明日')) {
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            return { extracted: true, value: tomorrow.toISOString().split('T')[0], confidence: 0.95 };
        }
        // Match YYYY/MM/DD or YYYY年MM月DD日
        const dateMatch = message.match(/(\d{4})[\/年](\d{1,2})[\/月](\d{1,2})/);
        if (dateMatch) {
            const [_, year, month, day] = dateMatch;
            return {
                extracted: true,
                value: `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`,
                confidence: 0.9
            };
        }
    }

    // Meeting type extraction
    if (targetField === 'meeting_type') {
        if (message.includes('理事会')) {
            return { extracted: true, value: 'board_meeting', confidence: 0.95 };
        }
        if (message.includes('評議員会')) {
            return { extracted: true, value: 'council_meeting', confidence: 0.95 };
        }
        if (message.includes('総会')) {
            return { extracted: true, value: 'general_meeting', confidence: 0.9 };
        }
        if (message.includes('委員会')) {
            return { extracted: true, value: 'committee', confidence: 0.85 };
        }
    }

    // Attendees extraction (comma or space separated names)
    if (targetField === 'attendees') {
        // Match Japanese names with optional role
        const namePattern = /([一-龯ぁ-んァ-ヶ]+(?:理事長|理事|監事|評議員)?)/g;
        const matches = message.match(namePattern);
        if (matches && matches.length > 0) {
            return { extracted: true, value: matches, confidence: 0.8 };
        }
    }

    return { extracted: false, value: null, confidence: 0 };
}

// ============================================================================
// Helper Functions
// ============================================================================

function getUpdateMessage(field: CanvasFieldType, value: any, action: string): string {
    const fieldLabels: Record<CanvasFieldType, string> = {
        date: '開催日',
        meeting_type: '会議種別',
        attendees: '出席者',
        agenda: '議題',
        content: '議事内容',
        corporation_name: '法人名',
        title: 'タイトル'
    };

    const label = fieldLabels[field] || field;

    if (action === 'set') {
        return `${label}を設定しました。`;
    } else if (action === 'append') {
        return `${label}に追加しました。`;
    }
    return `${label}を更新しました。`;
}

function getAppendMessage(field: 'attendees' | 'agenda', items: string[]): string {
    if (field === 'attendees') {
        return `出席者に${items.join('、')}を追加しました。`;
    } else {
        return `議題に${items.length}件追加しました。`;
    }
}
