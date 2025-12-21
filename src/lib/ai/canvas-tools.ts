'use server';

import { createClient } from '@/lib/supabase/server';

// ============================================================================
// Canvas Types
// ============================================================================

export type CanvasType =
    | 'officer_list'
    | 'minutes_editor'
    | 'document_preview'
    | 'meeting_form'
    | null;

export interface CanvasState {
    type: CanvasType;
    title: string;
    data?: any;
    draftId?: string;
}

export interface DraftState {
    id: string;
    type: CanvasType;
    title: string;
    content: any;
    createdAt: Date;
}

// ============================================================================
// Draft Management (Auto-save)
// ============================================================================

const draftsStore = new Map<string, DraftState>();

export async function saveDraft(userId: string, draft: Omit<DraftState, 'id' | 'createdAt'>): Promise<string> {
    const draftId = `draft_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    draftsStore.set(`${userId}_${draftId}`, {
        ...draft,
        id: draftId,
        createdAt: new Date()
    });
    return draftId;
}

export async function getDraft(userId: string, draftId: string): Promise<DraftState | null> {
    return draftsStore.get(`${userId}_${draftId}`) || null;
}

export async function clearDraft(userId: string, draftId: string): Promise<void> {
    draftsStore.delete(`${userId}_${draftId}`);
}

// ============================================================================
// AI Tool Actions - Canvas Control
// ============================================================================

/**
 * Show Officer List in Canvas
 */
export async function showOfficerList(): Promise<{
    canvas: CanvasState;
    officers: any[];
    message: string;
}> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return {
            canvas: { type: null, title: '' },
            officers: [],
            message: 'ログインが必要です。'
        };
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

    if (!profile?.organization_id) {
        return {
            canvas: { type: null, title: '' },
            officers: [],
            message: '組織情報が見つかりません。'
        };
    }

    const { data: officers } = await supabase
        .from('officers')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .eq('is_active', true)
        .order('role');

    return {
        canvas: {
            type: 'officer_list',
            title: '役員名簿',
            data: officers
        },
        officers: officers || [],
        message: `役員名簿をお見せしますね。現在${officers?.length || 0}名の役員が登録されています。`
    };
}

/**
 * Open Minutes Editor in Canvas
 */
export async function draftMinutes(meetingType?: string): Promise<{
    canvas: CanvasState;
    template: any;
    message: string;
}> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return {
            canvas: { type: null, title: '' },
            template: null,
            message: 'ログインが必要です。'
        };
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id, corporation_name')
        .eq('id', user.id)
        .single();

    // Prepare template based on meeting type
    const template = {
        meetingType: meetingType || 'board_meeting',
        corporationName: profile?.corporation_name || '',
        date: new Date().toISOString().split('T')[0],
        attendees: [],
        agenda: [],
        content: ''
    };

    return {
        canvas: {
            type: 'minutes_editor',
            title: '議事録作成',
            data: template
        },
        template,
        message: `議事録作成エディタを開きました。${meetingType === 'board_meeting' ? '理事会' : meetingType === 'council_meeting' ? '評議員会' : '会議'}の議事録ですね。必要な情報を入力してください。`
    };
}

/**
 * Clear Canvas (Context Switch)
 */
export async function clearCanvas(
    currentCanvas: CanvasState | null,
    reason?: string
): Promise<{
    canvas: CanvasState;
    savedDraftId?: string;
    message: string;
}> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let savedDraftId: string | undefined;
    let draftMessage = '';

    // Auto-save current canvas content as draft if it has data
    if (user && currentCanvas?.type && currentCanvas.data) {
        savedDraftId = await saveDraft(user.id, {
            type: currentCanvas.type,
            title: currentCanvas.title,
            content: currentCanvas.data
        });

        const typeLabel = currentCanvas.type === 'minutes_editor' ? '議事録'
            : currentCanvas.type === 'officer_list' ? '役員名簿'
                : '作業内容';
        draftMessage = `${typeLabel}は一時保存しました。`;
    }

    return {
        canvas: { type: null, title: '' },
        savedDraftId,
        message: draftMessage + (reason || 'キャンバスをクリアしました。')
    };
}

/**
 * Restore Draft to Canvas
 */
export async function restoreDraft(draftId: string): Promise<{
    canvas: CanvasState;
    message: string;
}> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return {
            canvas: { type: null, title: '' },
            message: 'ログインが必要です。'
        };
    }

    const draft = await getDraft(user.id, draftId);

    if (!draft) {
        return {
            canvas: { type: null, title: '' },
            message: '下書きが見つかりませんでした。'
        };
    }

    return {
        canvas: {
            type: draft.type,
            title: draft.title,
            data: draft.content,
            draftId: draft.id
        },
        message: `${draft.title}の下書きを復元しました。`
    };
}
