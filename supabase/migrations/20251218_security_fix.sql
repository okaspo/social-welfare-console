-- Security Fix Migration for Phase 6
-- Date: 2025-12-18

-- 1. Secure Articles (Allow Org-Specific Articles)
-- Add organization_id if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'articles' AND column_name = 'organization_id') THEN
        ALTER TABLE public.articles ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Drop insecure policies (Global Read/Write)
DROP POLICY IF EXISTS "Users can view articles" ON public.articles;
DROP POLICY IF EXISTS "Users can insert articles" ON public.articles;
DROP POLICY IF EXISTS "Users can update articles" ON public.articles;

-- Add Hybrid Policies
-- 1. View: Allow if org_id matches OR org_id is NULL (Shared)
CREATE POLICY "Users view shared and own articles" ON public.articles
    FOR SELECT USING (
        organization_id IS NULL OR
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    );

-- 2. Insert/Update: Only for own organization
CREATE POLICY "Users manage own articles" ON public.articles
    FOR ALL
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    )
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    );

-- 2. Secure Meetings (Ensure RLS)
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;

-- Re-apply policies (Idempotent)
DROP POLICY IF EXISTS "Users can view their organization meetings" ON public.meetings;
DROP POLICY IF EXISTS "Users can manage their organization meetings" ON public.meetings;

CREATE POLICY "Users can view their organization meetings" ON public.meetings
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can manage their organization meetings" ON public.meetings
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    );

-- 3. Audit Logs (Ensure RLS)
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
-- Policy already in Phase 3 schema, but good to be safe.
-- Admins view organization audit logs.

