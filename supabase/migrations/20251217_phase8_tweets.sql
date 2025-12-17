-- Daily Mutterings System
CREATE TABLE IF NOT EXISTS public.daily_tweets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    image_url TEXT,
    assistant_code TEXT DEFAULT 'aoi',
    published_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.daily_tweets ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Everyone can read tweets" ON public.daily_tweets
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage tweets" ON public.daily_tweets
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Seed Data (Example for today)
INSERT INTO public.daily_tweets (content, published_date) VALUES 
('今日はいいお天気ですね。コーヒーでも飲んで一息つきましょう☕', CURRENT_DATE);
