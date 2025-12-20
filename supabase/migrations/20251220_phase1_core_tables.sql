-- Phase 1: Core Tables Setup (Multi-Entity Foundation)
-- Rescue & Restart Migration

-- ============================================================================
-- A. Organizations (Tenant)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    entity_type TEXT NOT NULL DEFAULT 'social_welfare' 
        CHECK (entity_type IN ('social_welfare', 'npo', 'medical_corp')),
    plan TEXT NOT NULL DEFAULT 'free' 
        CHECK (plan IN ('free', 'standard', 'pro', 'enterprise')),
    stripe_customer_id TEXT,
    subscription_status TEXT DEFAULT 'active'
        CHECK (subscription_status IN ('active', 'canceled', 'past_due', 'trialing')),
    current_period_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- RLS for Organizations
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own organization" ON public.organizations;
CREATE POLICY "Users can view their own organization" ON public.organizations
    FOR SELECT USING (
        id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    );

COMMENT ON TABLE public.organizations IS 'Multi-tenant organization (social welfare corp, NPO, medical corp)';
COMMENT ON COLUMN public.organizations.entity_type IS 'Type: social_welfare, npo, medical_corp';
COMMENT ON COLUMN public.organizations.plan IS 'Subscription plan: free, standard, pro, enterprise';

-- ============================================================================
-- B. Assistant Profiles (Persona Master)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.assistant_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE CHECK (code IN ('aoi', 'aki', 'ami')),
    name TEXT NOT NULL,
    avatar_url TEXT DEFAULT '/assets/avatars/aoi_face_icon.jpg',
    tone_prompt TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- RLS for Assistant Profiles (read-only for all authenticated users)
ALTER TABLE public.assistant_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Everyone can view assistant profiles" ON public.assistant_profiles;
CREATE POLICY "Everyone can view assistant profiles" ON public.assistant_profiles
    FOR SELECT USING (true);

COMMENT ON TABLE public.assistant_profiles IS 'AI assistant persona definitions (appearance, tone)';
COMMENT ON COLUMN public.assistant_profiles.code IS 'Unique code: aoi, aki, ami';
COMMENT ON COLUMN public.assistant_profiles.tone_prompt IS 'System prompt fragment for personality/tone';

-- ============================================================================
-- C. Officers (Governance Core)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.officers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('director', 'auditor', 'councilor', 'selection_committee')),
    term_start DATE,
    term_end DATE,
    email TEXT,
    expertise_tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- RLS for Officers
ALTER TABLE public.officers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their organization officers" ON public.officers;
CREATE POLICY "Users can view their organization officers" ON public.officers
    FOR SELECT USING (
        organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    );

DROP POLICY IF EXISTS "Users can manage their organization officers" ON public.officers;
CREATE POLICY "Users can manage their organization officers" ON public.officers
    FOR ALL USING (
        organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_officers_org ON public.officers(organization_id);
CREATE INDEX IF NOT EXISTS idx_officers_role ON public.officers(role);
CREATE INDEX IF NOT EXISTS idx_officers_term_end ON public.officers(term_end);

COMMENT ON TABLE public.officers IS 'Organization officers (directors, auditors, councilors)';
COMMENT ON COLUMN public.officers.role IS 'Role: director (理事), auditor (監事), councilor (評議員), selection_committee (選任解任委員)';
COMMENT ON COLUMN public.officers.expertise_tags IS 'Expertise areas: financial, legal, welfare, medical, etc.';
