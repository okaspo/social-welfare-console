-- Phase 3: Comprehensive Deployment Schema
-- Unified migration for Multi-Entity, Seasonal Avatars, Audit Logs, and Governance extensions.
-- Date: 2025-12-17

-- ============================================================================
-- 1. Multi-Entity Extensions
-- ============================================================================

-- Add custom_domain to organizations for Pro/Enterprise branding
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS custom_domain TEXT UNIQUE;

-- Add entity_type first! (It was missing in init)
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS entity_type TEXT DEFAULT 'social_welfare';

-- Update entity_type check constraint to include 'general_inc'
-- Note: Requires dropping and re-adding constraint safely
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'organizations_entity_type_check'
    ) THEN
        ALTER TABLE public.organizations DROP CONSTRAINT organizations_entity_type_check;
    END IF;
    
    ALTER TABLE public.organizations 
    ADD CONSTRAINT organizations_entity_type_check 
    CHECK (entity_type IN ('social_welfare', 'npo', 'medical_corp', 'general_inc'));
END $$;


-- ============================================================================
-- 2. Seasonal Avatars (Multi-Persona System)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.assistant_avatars (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_code TEXT NOT NULL, -- e.g., 'aoi', 'aki'
    season TEXT NOT NULL, -- 'spring', 'summer', 'autumn', 'winter', 'halloween', 'new_year'
    image_url TEXT NOT NULL,
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.assistant_avatars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view assistant avatars" ON public.assistant_avatars
    FOR SELECT USING (true);


-- ============================================================================
-- 3. Audit Logs (Security & God Mode Tracking)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    actor_id UUID REFERENCES auth.users(id), -- Nullable for system actions
    action_type TEXT NOT NULL, -- 'login_as', 'update_plan', 'approve_minutes'
    target_resource TEXT NOT NULL, -- 'officers', 'minutes', 'billing'
    details JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only Admins can view audit logs (and only for their org, or super admin for all)
CREATE POLICY "Admins view organization audit logs" ON public.audit_logs
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================================================
-- 4. Governance Extensions
-- ============================================================================

-- Add expertise tags to officers for "Balance Check"
ALTER TABLE public.officers 
ADD COLUMN IF NOT EXISTS expertise_tags TEXT[] DEFAULT '{}';

-- Add index for expertise search
CREATE INDEX IF NOT EXISTS idx_officers_expertise ON public.officers USING GIN (expertise_tags);


-- ============================================================================
-- 5. Subsidies (Growth) - Ensure Table Exists
-- ============================================================================
-- (This might be redundant if phase9_growth.sql ran, but harmless with IF NOT EXISTS)

CREATE TABLE IF NOT EXISTS public.subsidies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    provider TEXT NOT NULL, -- e.g. MHLW, METI
    category TEXT NOT NULL, -- 'operation', 'equipment', 'hr'
    target_entity_types TEXT[] NOT NULL, -- Array of 'social_welfare', etc.
    target_regions TEXT[] DEFAULT '{all}',
    target_business_types TEXT[] DEFAULT '{all}',
    amount_min BIGINT,
    amount_max BIGINT,
    requirements JSONB,
    source_url TEXT,
    application_period_start DATE,
    application_period_end DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.subsidies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view subsidies" ON public.subsidies
    FOR SELECT USING (true);
