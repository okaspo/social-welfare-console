-- Create documents table for storing generated minutes and other files
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    title TEXT NOT NULL,
    content TEXT, -- Markdown or text content
    category TEXT DEFAULT 'MINUTES', -- MINUTES, REPORT, UPLOAD
    status TEXT DEFAULT 'DRAFT', -- DRAFT, FINAL
    metadata JSONB DEFAULT '{}'::jsonb, -- Store extra info like attendees, date, place
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Members can view org documents" ON documents
    FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "Members can insert org documents" ON documents
    FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM profiles
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "Members can update org documents" ON documents
    FOR UPDATE
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles
            WHERE id = auth.uid()
        )
    );
