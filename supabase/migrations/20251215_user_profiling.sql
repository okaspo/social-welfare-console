-- User Profiling: Add profile fields for personalization
-- Date: 2025-12-15

-- Add new columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS job_title TEXT,
ADD COLUMN IF NOT EXISTS age_group TEXT CHECK (age_group IN ('20s', '30s', '40s', '50s', '60s+')),
ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female', 'other', 'no_answer')),
ADD COLUMN IF NOT EXISTS preferred_tone TEXT DEFAULT 'normal',
ADD COLUMN IF NOT EXISTS corporation_name TEXT;

-- Add RLS policy for users to update their own profile
CREATE POLICY IF NOT EXISTS "Users can update own profile" ON profiles
    FOR UPDATE
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- Add comment for documentation
COMMENT ON COLUMN profiles.job_title IS 'User job title/position (e.g., 理事長, 事務長, 職員)';
COMMENT ON COLUMN profiles.age_group IS 'User age bracket for tone adaptation';
COMMENT ON COLUMN profiles.gender IS 'User gender (optional for personalization)';
COMMENT ON COLUMN profiles.preferred_tone IS 'Future: tone preference (normal, strict, gentle)';
COMMENT ON COLUMN profiles.corporation_name IS 'Corporation/organization name for context';
