// Avatar Selector - Dynamic avatar selection based on context
import { createClient } from '@/lib/supabase/server';

interface AvatarContext {
    emotion?: 'happy' | 'thinking' | 'apology';
    date?: Date;
}

/**
 * Get the appropriate avatar for an assistant based on context
 */
export async function getAssistantAvatar(
    assistantCode: string,
    context?: AvatarContext
): Promise<string> {
    const supabase = await createClient();
    const today = context?.date || new Date();

    // Priority 1: Active period event
    const eventAvatar = await getEventAvatar(supabase, assistantCode, today);
    if (eventAvatar) return eventAvatar;

    // Priority 2: Emotion context
    if (context?.emotion) {
        const emotionAvatar = await getEmotionAvatar(supabase, assistantCode, context.emotion);
        if (emotionAvatar) return emotionAvatar;
    }

    // Priority 3: Season
    const season = getSeasonByMonth(today.getMonth() + 1);
    const seasonAvatar = await getSeasonAvatar(supabase, assistantCode, season);
    if (seasonAvatar) return seasonAvatar;

    // Fallback: Default
    return getDefaultAvatar(supabase, assistantCode);
}

async function getEventAvatar(supabase: any, code: string, date: Date): Promise<string | null> {
    const dateStr = date.toISOString().split('T')[0];

    const { data } = await supabase
        .from('assistant_avatars')
        .select('image_url')
        .eq('assistant_code', code)
        .eq('condition_type', 'event')
        .lte('active_period_start', dateStr)
        .gte('active_period_end', dateStr)
        .order('priority', { ascending: false })
        .limit(1)
        .single();

    return data?.image_url || null;
}

async function getEmotionAvatar(supabase: any, code: string, emotion: string): Promise<string | null> {
    const { data } = await supabase
        .from('assistant_avatars')
        .select('image_url')
        .eq('assistant_code', code)
        .eq('condition_type', 'emotion')
        .eq('condition_value', emotion)
        .limit(1)
        .single();

    return data?.image_url || null;
}

async function getSeasonAvatar(supabase: any, code: string, season: string): Promise<string | null> {
    const { data } = await supabase
        .from('assistant_avatars')
        .select('image_url')
        .eq('assistant_code', code)
        .eq('condition_type', 'season')
        .eq('condition_value', season)
        .limit(1)
        .single();

    return data?.image_url || null;
}

async function getDefaultAvatar(supabase: any, code: string): Promise<string> {
    const { data } = await supabase
        .from('assistant_avatars')
        .select('image_url')
        .eq('assistant_code', code)
        .eq('condition_type', 'default')
        .limit(1)
        .single();

    return data?.image_url || `/avatars/${code}/default.png`;
}

function getSeasonByMonth(month: number): string {
    if (month >= 3 && month <= 5) return 'spring';
    if (month >= 6 && month <= 8) return 'summer';
    if (month >= 9 && month <= 11) return 'autumn';
    return 'winter';
}
