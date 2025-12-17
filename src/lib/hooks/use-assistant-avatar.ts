'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export function useAssistantAvatar(assistantCode: string = 'aoi') {
    const [avatarUrl, setAvatarUrl] = useState<string>(''); // removed null init to avoid flicker if possible, or handle loading
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        async function fetchAvatar() {
            setLoading(true);
            const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

            // 1. Try to find a specific seasonal/event avatar active TODAY
            const { data: activeAvatars } = await supabase
                .from('assistant_avatars')
                .select('image_url, condition_type')
                .eq('assistant_code', assistantCode)
                .or(`condition_type.eq.season,condition_type.eq.emotion`)
                .lte('active_period_start', today)
                .gte('active_period_end', today)
                .limit(1);

            if (activeAvatars && activeAvatars.length > 0) {
                setAvatarUrl(activeAvatars[0].image_url);
                setLoading(false);
                return;
            }

            // 2. Fallback to Default
            const { data: defaultAvatar } = await supabase
                .from('assistant_avatars')
                .select('image_url')
                .eq('assistant_code', assistantCode)
                .eq('condition_type', 'default')
                .single();

            if (defaultAvatar) {
                setAvatarUrl(defaultAvatar.image_url);
            } else {
                // Hard fallback if DB empty
                setAvatarUrl('/avatars/aoi_default.png');
            }
            setLoading(false);
        }

        fetchAvatar();
    }, [assistantCode]);

    return { avatarUrl, loading };
}
