'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Coffee, Quote } from 'lucide-react';
import { useAssistantAvatar } from '@/lib/hooks/use-assistant-avatar';

export function DailyMutter() {
    const [tweet, setTweet] = useState<{ content: string, image_url: string | null } | null>(null);
    const supabase = createClient();
    const { avatarUrl } = useAssistantAvatar('aoi');

    useEffect(() => {
        const fetchTweet = async () => {
            try {
                const today = new Date().toISOString().split('T')[0];

                const { data, error } = await supabase
                    .from('daily_tweets')
                    .select('content, image_url')
                    .eq('published_date', today)
                    .limit(1)
                    .single();

                if (error || !data) {
                    // Fallback content if no tweet for today or table missing
                    setTweet({
                        content: '休憩も仕事のうちです。無理せずいきましょう。',
                        image_url: null
                    });
                } else {
                    setTweet(data);
                }
            } catch (e) {
                // Silent failure fallback
                setTweet({
                    content: '休憩も仕事のうちです。無理せずいきましょう。',
                    image_url: null
                });
            }
        };

        fetchTweet();
    }, []);

    if (!tweet) return null;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-start gap-4 hover:shadow-md transition-shadow">
            <div className="relative flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-gray-100 overflow-hidden border border-gray-200">
                    {avatarUrl ? (
                        <img src={avatarUrl} alt="Aoi" className="w-full h-full object-cover" />
                    ) : (
                        <Coffee className="h-6 w-6 text-gray-400 m-3" />
                    )}
                </div>
                <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 border border-gray-100 shadow-sm">
                    <Quote className="h-4 w-4 text-[#607D8B]" />
                </div>
            </div>

            <div className="flex-1 pt-1">
                <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-sm text-gray-700">今日の葵さん</span>
                    <span className="text-xs text-gray-400">{new Date().toLocaleDateString('ja-JP')}</span>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed font-manual-sans">
                    {tweet.content}
                </p>
            </div>
        </div>
    );
}
