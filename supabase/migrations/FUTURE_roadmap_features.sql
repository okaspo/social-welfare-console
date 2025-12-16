-- Future Roadmap: Subsidy AI Matcher
-- High-priority revenue feature
-- Date: 2025-12-16 (Design Only)

-- ============================================================================
-- Subsidy Master Data
-- ============================================================================

CREATE TABLE IF NOT EXISTS subsidies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Basic Info
    title TEXT NOT NULL,
    provider TEXT NOT NULL, -- 行政機関名 (e.g., '厚生労働省', '東京都')
    category TEXT CHECK (category IN (
        'facility', 'training', 'operation', 'welfare', 'other'
    )) NOT NULL,
    
    -- Targeting
    target_entity_types TEXT[] DEFAULT ARRAY['social_welfare'], -- Entity type filter
    target_regions TEXT[], -- ['tokyo', 'osaka', 'all']
    target_business_types TEXT[], -- ['elderly_care', 'childcare', 'disability']
    
    -- Amount
    amount_min BIGINT, -- Minimum grant amount (JPY)
    amount_max BIGINT, -- Maximum grant amount (JPY)
    
    -- Application Period
    application_period_start DATE NOT NULL,
    application_period_end DATE NOT NULL,
    
    -- Requirements (structured JSON)
    requirements JSONB, -- { "min_employees": 10, "years_in_business": 3 }
    
    -- Source
    source_url TEXT, -- Link to official announcement
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_subsidies_active ON subsidies(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_subsidies_period ON subsidies(application_period_end DESC);
CREATE INDEX IF NOT EXISTS idx_subsidies_entity ON subsidies USING GIN(target_entity_types);
CREATE INDEX IF NOT EXISTS idx_subsidies_region ON subsidies USING GIN(target_regions);

COMMENT ON TABLE subsidies IS 'Master data of government subsidies and grants';

-- ============================================================================
-- Organization Subsidy Matches
-- ============================================================================

CREATE TABLE IF NOT EXISTS organization_subsidies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    subsidy_id UUID REFERENCES subsidies(id) ON DELETE CASCADE NOT NULL,
    
    -- Matching
    match_score DECIMAL(3, 2) CHECK (match_score >= 0 AND match_score <= 1), -- AI confidence (0-1)
    match_reason TEXT, -- Why this subsidy was recommended
    
    -- Status
    status TEXT CHECK (status IN (
        'matched', 'reviewing', 'applied', 'granted', 'rejected', 'ignored'
    )) DEFAULT 'matched',
    
    -- Dates
    applied_at TIMESTAMPTZ,
    result_at TIMESTAMPTZ,
    
    -- Notes
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    UNIQUE(organization_id, subsidy_id)
);

CREATE INDEX IF NOT EXISTS idx_org_subsidies_org ON organization_subsidies(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_subsidies_status ON organization_subsidies(status);
CREATE INDEX IF NOT EXISTS idx_org_subsidies_score ON organization_subsidies(match_score DESC);

COMMENT ON TABLE organization_subsidies IS 'AI-matched subsidies for each organization';

-- ============================================================================
-- Referral System
-- ============================================================================

CREATE TABLE IF NOT EXISTS referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    referee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Tracking
    referral_code TEXT UNIQUE NOT NULL,
    status TEXT CHECK (status IN (
        'pending', 'signed_up', 'activated', 'converted'
    )) DEFAULT 'pending',
    
    -- Rewards
    reward_type TEXT, -- 'credit', 'free_month', 'discount'
    reward_value DECIMAL,
    reward_claimed BOOLEAN DEFAULT FALSE,
    reward_claimed_at TIMESTAMPTZ,
    
    -- Dates
    referred_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    converted_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);

COMMENT ON TABLE referrals IS 'User referral tracking for growth';

-- ============================================================================
-- Demo Mode Tracking (LocalStorage based, minimal DB)
-- ============================================================================

-- Note: Guest demo uses browser LocalStorage for quota.
-- This table is optional for analytics only.

CREATE TABLE IF NOT EXISTS demo_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT UNIQUE NOT NULL, -- Browser-generated UUID
    
    -- Usage
    chat_count INTEGER DEFAULT 0,
    document_count INTEGER DEFAULT 0,
    
    -- Conversion
    converted_to_user_id UUID REFERENCES auth.users(id),
    converted_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    last_activity_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_demo_sessions_session ON demo_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_demo_sessions_converted ON demo_sessions(converted_to_user_id) WHERE converted_to_user_id IS NOT NULL;

COMMENT ON TABLE demo_sessions IS 'Optional analytics for guest demo mode (主にLocalStorageベース)';

-- ============================================================================
-- Sample Data: Subsidies
-- ============================================================================

INSERT INTO subsidies (
    title, provider, category, 
    target_entity_types, target_regions, target_business_types,
    amount_min, amount_max,
    application_period_start, application_period_end,
    source_url
) VALUES
(
    '社会福祉施設等施設整備費補助金',
    '厚生労働省',
    'facility',
    ARRAY['social_welfare'],
    ARRAY['all'],
    ARRAY['elderly_care', 'childcare', 'disability'],
    10000000, -- 1000万円
    500000000, -- 5億円
    '2025-04-01',
    '2025-06-30',
    'https://www.mhlw.go.jp/example'
),
(
    'NPO法人活動支援助成金',
    '東京都',
    'operation',
    ARRAY['npo'],
    ARRAY['tokyo'],
    ARRAY['community', 'welfare'],
    500000, -- 50万円
    3000000, -- 300万円
    '2025-01-15',
    '2025-03-31',
    'https://www.metro.tokyo.lg.jp/example'
);
