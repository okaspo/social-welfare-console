-- Phase 9: Growth & Utility Features

-- 1. Referral System
CREATE TABLE IF NOT EXISTS public.referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID NOT NULL REFERENCES auth.users(id), -- User who invited
    referee_id UUID REFERENCES auth.users(id), -- User who was invited (nullable until signup)
    referral_code TEXT NOT NULL UNIQUE,
    status TEXT DEFAULT 'pending', -- 'pending', 'converted', 'rewarded'
    reward_claimed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    converted_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Referrers can view their referrals" ON public.referrals
    FOR SELECT USING (auth.uid() = referrer_id);

CREATE POLICY "Users can create referrals" ON public.referrals
    FOR INSERT WITH CHECK (auth.uid() = referrer_id);


-- 2. Subsidy AI Matcher System
CREATE TABLE IF NOT EXISTS public.subsidies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    provider TEXT, -- Government body / Municipality
    category TEXT, -- 'equipment', 'hr', 'operation', etc.
    target_entity_types TEXT[], -- ['social_welfare', 'npo', 'medical_corp']
    target_regions TEXT[], -- ['tokyo', 'osaka', 'all']
    target_business_types TEXT[], -- ['elderly_care', 'childcare', 'disability']
    amount_min BIGINT,
    amount_max BIGINT,
    application_period_start DATE,
    application_period_end DATE,
    requirements JSONB, -- Structured requirements for AI matching
    source_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.organization_subsidies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    subsidy_id UUID NOT NULL REFERENCES public.subsidies(id),
    match_score DECIMAL, -- AI confidence score (0.0 - 1.0)
    status TEXT DEFAULT 'matched', -- 'matched', 'interested', 'applied', 'granted', 'rejected', 'hidden'
    notes TEXT,
    applied_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, subsidy_id)
);

ALTER TABLE public.subsidies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_subsidies ENABLE ROW LEVEL SECURITY;

-- Subsidies are public read (or gated by plan in app logic, but DB level is open for now to authenticated)
CREATE POLICY "Authenticated users can read subsidies" ON public.subsidies
    FOR SELECT USING (auth.role() = 'authenticated');

-- Organization specific matches
CREATE POLICY "Users can view their org matches" ON public.organization_subsidies
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.organization_members
            WHERE organization_members.organization_id = organization_subsidies.organization_id
            AND organization_members.user_id = auth.uid()
        )
        OR 
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.organization_id = organization_subsidies.organization_id
        )
    );

CREATE POLICY "Users can update their org matches" ON public.organization_subsidies
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.organization_members
            WHERE organization_members.organization_id = organization_subsidies.organization_id
            AND organization_members.user_id = auth.uid()
        )
        OR 
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.organization_id = organization_subsidies.organization_id
        )
    );
