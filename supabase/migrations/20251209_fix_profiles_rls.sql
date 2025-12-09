-- Add corporation_name column if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS corporation_name TEXT;

-- Allow users to insert their own profile
-- Note: 'ON CONFLICT' in application code handles upsert, but we need INSERT policy for new rows
CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE
    USING (auth.uid() = id);
