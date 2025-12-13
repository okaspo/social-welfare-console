-- Enable RLS on organizations table
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- 1. Read Access
-- Users can view their own organization
DROP POLICY IF EXISTS "Users can view own organization" ON public.organizations;
CREATE POLICY "Users can view own organization" ON public.organizations
    FOR SELECT
    USING (
        id IN (
            SELECT organization_id FROM public.profiles
            WHERE id = auth.uid()
        )
    );

-- 2. Update Access
-- Users can update their own organization details
DROP POLICY IF EXISTS "Users can update own organization" ON public.organizations;
CREATE POLICY "Users can update own organization" ON public.organizations
    FOR UPDATE
    USING (
        id IN (
            SELECT organization_id FROM public.profiles
            WHERE id = auth.uid()
        )
    );
