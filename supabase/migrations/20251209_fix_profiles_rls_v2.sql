-- Add corporation_name column if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS corporation_name TEXT;

-- Drop existing policies to allow re-creation without error
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Allow users to insert their own profile
CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE
    USING (auth.uid() = id);
