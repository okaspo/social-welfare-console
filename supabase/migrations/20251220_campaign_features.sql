-- Campaign System for Feature Unlocking
-- Allows promotional campaigns to temporarily unlock features for users

BEGIN;

-- ============================================================================
-- 1. Campaign Codes Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS campaign_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    description TEXT,
    
    -- Campaign Validity
    starts_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    
    -- Usage Limits
    max_uses INTEGER,  -- NULL = unlimited
    current_uses INTEGER DEFAULT 0 NOT NULL,
    
    -- Feature Unlock
    unlocked_features TEXT[] DEFAULT ARRAY[]::TEXT[],  -- ['word_export', 'email_sending']
    target_plans TEXT[] DEFAULT ARRAY['free'], -- Which plans can use this campaign
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_campaign_codes_code ON campaign_codes(code);
CREATE INDEX IF NOT EXISTS idx_campaign_codes_active ON campaign_codes(is_active, expires_at);

COMMENT ON TABLE campaign_codes IS 'Promotional campaign codes with feature unlock capability';
COMMENT ON COLUMN campaign_codes.unlocked_features IS 'Array of feature keys temporarily unlocked by this campaign';
COMMENT ON COLUMN campaign_codes.target_plans IS 'Which plans can apply this campaign';

-- ============================================================================
-- 2. User Campaign Applications
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_campaign_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    campaign_id UUID REFERENCES campaign_codes(id) ON DELETE CASCADE NOT NULL,
    
    applied_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    expires_at TIMESTAMPTZ,  -- When features expire for this user
    
    UNIQUE(user_id, campaign_id)
);

CREATE INDEX IF NOT EXISTS idx_user_campaigns_user ON user_campaign_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_campaigns_org ON user_campaign_applications(organization_id);
CREATE INDEX IF NOT EXISTS idx_user_campaigns_expires ON user_campaign_applications(expires_at);

COMMENT ON TABLE user_campaign_applications IS 'Tracks which users have applied which campaigns';

-- ============================================================================
-- 3. RLS Policies
-- ============================================================================

ALTER TABLE campaign_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_campaign_applications ENABLE ROW LEVEL SECURITY;

-- Public can view active campaigns
DROP POLICY IF EXISTS "Public can view active campaigns" ON campaign_codes;
CREATE POLICY "Public can view active campaigns"
    ON campaign_codes FOR SELECT
    USING (is_active = TRUE AND (expires_at IS NULL OR expires_at > NOW()));

-- Users can view their campaign applications
DROP POLICY IF EXISTS "Users can view their campaign applications" ON user_campaign_applications;
CREATE POLICY "Users can view their campaign applications"
    ON user_campaign_applications FOR SELECT
    USING (user_id = auth.uid());

-- Users can insert their own campaign applications
DROP POLICY IF EXISTS "Users can insert campaign applications" ON user_campaign_applications;
CREATE POLICY "Users can insert campaign applications"
    ON user_campaign_applications FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- 4. Sample Campaigns
-- ============================================================================

-- Spring 2025 Campaign for Free users
INSERT INTO campaign_codes (code, description, starts_at, expires_at, unlocked_features, target_plans, max_uses)
VALUES (
    'SPRING2025',
    '春の新機能体験キャンペーン - Freeユーザー向けWord出力とメール送信を期間限定解放',
    NOW(),
    NOW() + INTERVAL '3 months',
    ARRAY['word_export', 'email_sending'],
    ARRAY['free'],
    100
) ON CONFLICT (code) DO NOTHING;

-- 14-day Trial for all plans
INSERT INTO campaign_codes (code, description, starts_at, expires_at, unlocked_features, target_plans, max_uses)
VALUES (
    'TRIAL14',
    '14日間無料トライアル - 高度AI機能を体験',
    NOW(),
    NULL,  -- No expiration for campaign itself (individual users get 14 days)
    ARRAY['long_term_memory', 'precision_check', 'legal_advisor'],
    ARRAY['free', 'standard'],
    NULL  -- Unlimited uses
) ON CONFLICT (code) DO NOTHING;

COMMIT;
