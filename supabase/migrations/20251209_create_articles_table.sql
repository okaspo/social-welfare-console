-- Create articles table (Master data)
CREATE TABLE articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    category TEXT NOT NULL, -- e.g., 'TEIKAN' (定款), 'REGULATION' (諸規程)
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create article_versions table (History)
CREATE TABLE article_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL, -- e.g. 1, 2, 3
    effective_date DATE,
    file_path TEXT NOT NULL, -- Path in Storage
    changelog TEXT, -- Description of changes
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_versions ENABLE ROW LEVEL SECURITY;

-- Policies for Articles
-- All authenticated users can view
CREATE POLICY "Users can view articles" ON articles
    FOR SELECT USING (auth.role() = 'authenticated');

-- Only users with specific roles (or all for now) can insert/update
CREATE POLICY "Users can insert articles" ON articles
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    
CREATE POLICY "Users can update articles" ON articles
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Policies for Article Versions
CREATE POLICY "Users can view article versions" ON article_versions
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert article versions" ON article_versions
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Storage Bucket Setup (Try to create if not exists)
-- Note: This requires permissions on the storage schema. If this fails, user must create bucket manually.
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
-- Allow authenticated users to upload to 'documents' bucket
CREATE POLICY "Authenticated users can upload documents" ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'documents' AND
        auth.role() = 'authenticated'
    );

-- Allow authenticated users to read documents
CREATE POLICY "Authenticated users can read documents" ON storage.objects
    FOR SELECT
    USING (
        bucket_id = 'documents' AND
        auth.role() = 'authenticated'
    );
