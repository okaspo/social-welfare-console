-- Add organization_id to articles table
ALTER TABLE articles
ADD COLUMN organization_id UUID REFERENCES organizations(id);

-- Enable RLS on articles if not already (it should be, but good to ensure)
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_versions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them with organization isolation
DROP POLICY IF EXISTS "Enable read access for all users" ON articles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON articles;
DROP POLICY IF EXISTS "Enable read access for all users" ON article_versions;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON article_versions;


-- === Policies for ARTICLES ===

-- 1. Read Access:
-- Users can see articles that belong to their organization OR articles with NULL organization_id (Common Knowledge)
CREATE POLICY "Users can view own org and common articles" ON articles
    FOR SELECT
    USING (
        organization_id IS NULL 
        OR 
        organization_id IN (
            SELECT organization_id FROM profiles
            WHERE id = auth.uid()
        )
    );

-- 2. Insert Access:
-- Users can insert articles only for their own organization.
-- We do NOT allow Users to insert Common Knowledge (organization_id IS NULL) directly via this policy.
-- (Admins would need a separate policy or direct SQL access, or we check role)
CREATE POLICY "Users can create own org articles" ON articles
    FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM profiles
            WHERE id = auth.uid()
        )
    );

-- 3. Update/Delete Access:
-- Users can update/delete only their own organization's articles.
CREATE POLICY "Users can update own org articles" ON articles
    FOR UPDATE
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own org articles" ON articles
    FOR DELETE
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles
            WHERE id = auth.uid()
        )
    );


-- === Policies for ARTICLE_VERSIONS ===

-- Version access is controlled by the parent article's accessibility.
-- However, we can also simplify by assuming if you can see the article, you can see `article_versions`?
-- Ideally we check the parent article's organization_id.

-- 1. Read Access:
CREATE POLICY "Users can view versions of accessible articles" ON article_versions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM articles
            WHERE articles.id = article_versions.article_id
            AND (
                articles.organization_id IS NULL
                OR
                articles.organization_id IN (
                    SELECT organization_id FROM profiles
                    WHERE id = auth.uid()
                )
            )
        )
    );

-- 2. Insert Access:
-- Users can add versions to articles belonging to their organization.
CREATE POLICY "Users can add versions to own org articles" ON article_versions
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM articles
            WHERE articles.id = article_versions.article_id
            AND articles.organization_id IN (
                SELECT organization_id FROM profiles
                WHERE id = auth.uid()
            )
        )
    );

-- 3. Update/Delete Access
CREATE POLICY "Users can update own org versions" ON article_versions
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM articles
            WHERE articles.id = article_versions.article_id
            AND articles.organization_id IN (
                SELECT organization_id FROM profiles
                WHERE id = auth.uid()
            )
        )
    );
