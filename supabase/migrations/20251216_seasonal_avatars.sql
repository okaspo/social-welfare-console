-- Add seasonal avatar support
ALTER TABLE public.assistant_profiles 
ADD COLUMN IF NOT EXISTS avatar_season_urls JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.assistant_profiles.avatar_season_urls IS 
'Map of season names to image URLs. e.g. {"spring": "url1", "summer": "url2", "autumn": "url3", "winter": "url4"}';

-- Add helper column for manual override if needed (optional)
ALTER TABLE public.assistant_profiles
ADD COLUMN IF NOT EXISTS current_avatar_override TEXT;
