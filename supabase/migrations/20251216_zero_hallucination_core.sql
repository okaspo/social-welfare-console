-- Zero-Hallucination Architecture: Core Infrastructure
-- Three-Tier Model Router + Precision Check System
-- Date: 2025-12-16

-- ============================================================================
-- 1. Chat Messages Table (Enhanced for Model Tier Tracking)
-- ============================================================================

CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Conversation Context
    conversation_id UUID NOT NULL, -- Groups related messages
    
    -- Message Content
    role TEXT CHECK (role IN ('user', 'assistant', 'system')) NOT NULL,
    content TEXT NOT NULL,
    
    -- Model Tier Tracking
    model_tier TEXT CHECK (model_tier IN ('processor', 'persona', 'advisor')) NULL, -- NULL for user messages
    model_used TEXT, -- Actual model name: 'gpt-4o-mini', 'gpt-4o', 'o1'
    
    -- Precision Check
    precision_checked_at TIMESTAMPTZ NULL,
    precision_check_result JSONB, -- { "verified": true, "confidence": 0.98, "corrections": [] }
    
    -- Metadata
    intent_detected TEXT, -- 'chat', 'legal_check', 'summarize', 'ocr'
    tokens_used INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_org ON chat_messages(organization_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation ON chat_messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_precision ON chat_messages(precision_checked_at) WHERE precision_checked_at IS NOT NULL;

COMMENT ON TABLE chat_messages IS 'Chat conversation history with model tier tracking and precision check support';
COMMENT ON COLUMN chat_messages.model_tier IS 'Which tier handled this message: processor (fast), persona (chat), advisor (legal)';
COMMENT ON COLUMN chat_messages.precision_check_result IS 'Result of o1 re-verification when user clicks precision check button';

-- RLS Policies
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization's chat messages"
    ON chat_messages FOR SELECT
    USING (
        organization_id IN (
            SELECT id FROM organizations 
            WHERE id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
        )
    );

CREATE POLICY "Users can insert their own chat messages"
    ON chat_messages FOR INSERT
    WITH CHECK (
        user_id = auth.uid() 
        AND organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
    );

CREATE POLICY "System can update precision check results"
    ON chat_messages FOR UPDATE
    USING (
        organization_id IN (
            SELECT id FROM organizations 
            WHERE id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
        )
    )
    WITH CHECK (
        organization_id IN (
            SELECT id FROM organizations 
            WHERE id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
        )
    );

-- ============================================================================
-- 2. Seasonal Avatars for Assistant Profiles
-- ============================================================================

ALTER TABLE assistant_profiles
ADD COLUMN IF NOT EXISTS avatar_spring_url TEXT,
ADD COLUMN IF NOT EXISTS avatar_summer_url TEXT,
ADD COLUMN IF NOT EXISTS avatar_autumn_url TEXT,
ADD COLUMN IF NOT EXISTS avatar_winter_url TEXT;

COMMENT ON COLUMN assistant_profiles.avatar_spring_url IS 'Avatar image for spring season (3-5月)';
COMMENT ON COLUMN assistant_profiles.avatar_summer_url IS 'Avatar image for summer season (6-8月)';
COMMENT ON COLUMN assistant_profiles.avatar_autumn_url IS 'Avatar image for autumn season (9-11月)';
COMMENT ON COLUMN assistant_profiles.avatar_winter_url IS 'Avatar image for winter season (12-2月)';

-- Update existing profiles with placeholder URLs (replace with actual images later)
UPDATE assistant_profiles SET
    avatar_spring_url = COALESCE(avatar_image_url, '/avatars/' || code_name || '_spring.png'),
    avatar_summer_url = COALESCE(avatar_image_url, '/avatars/' || code_name || '_summer.png'),
    avatar_autumn_url = COALESCE(avatar_image_url, '/avatars/' || code_name || '_autumn.png'),
    avatar_winter_url = COALESCE(avatar_image_url, '/avatars/' || code_name || '_winter.png');

-- ============================================================================
-- 3. Model Router Intent Detection Log
-- ============================================================================

CREATE TABLE IF NOT EXISTS model_router_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Input
    user_message TEXT NOT NULL,
    detected_intent TEXT NOT NULL, -- 'chat', 'legal_check', 'ocr', 'summarize', 'tag'
    
    -- Routing Decision
    selected_tier TEXT CHECK (selected_tier IN ('processor', 'persona', 'advisor')) NOT NULL,
    selected_model TEXT NOT NULL, -- Actual model name
    
    -- Performance
    processing_time_ms INTEGER,
    
    -- Override tracking (for debugging/analysis)
    was_overridden BOOLEAN DEFAULT FALSE, -- True if user/admin manually requested specific model
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_router_logs_org ON model_router_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_router_logs_intent ON model_router_logs(detected_intent);
CREATE INDEX IF NOT EXISTS idx_router_logs_tier ON model_router_logs(selected_tier);
CREATE INDEX IF NOT EXISTS idx_router_logs_created ON model_router_logs(created_at DESC);

COMMENT ON TABLE model_router_logs IS 'Logs of model routing decisions for analytics and debugging';

-- ============================================================================
-- 4. Legal Check Audit Trail (Supervisor Pattern)
-- ============================================================================

CREATE TABLE IF NOT EXISTS legal_check_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Input Context
    user_input TEXT NOT NULL,
    legal_context_ids UUID[], -- References to knowledge_items or articles used
    
    -- Phase 1: o1 Logic Output (JSON)
    o1_raw_output JSONB NOT NULL, -- { "compliant": true, "reasoning": "..." }
    
    -- Phase 2: 4o Translation
    translated_explanation TEXT NOT NULL, -- User-friendly explanation in persona voice
    
    -- Result
    is_compliant BOOLEAN NOT NULL,
    severity TEXT CHECK (severity IN ('info', 'warning', 'error', 'critical')),
    
    -- Referenced Laws
    legal_references TEXT[], -- ['社会福祉法第45条の13', '会社法第915条']
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_legal_checks_org ON legal_check_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_legal_checks_user ON legal_check_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_legal_checks_compliant ON legal_check_logs(is_compliant);
CREATE INDEX IF NOT EXISTS idx_legal_checks_created ON legal_check_logs(created_at DESC);

COMMENT ON TABLE legal_check_logs IS 'Audit trail of legal compliance checks using o1 Supervisor Pattern';
COMMENT ON COLUMN legal_check_logs.o1_raw_output IS 'Raw JSON output from o1 model (Phase 1)';
COMMENT ON COLUMN legal_check_logs.translated_explanation IS 'User-friendly explanation from gpt-4o (Phase 2)';

-- RLS Policies
ALTER TABLE legal_check_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization's legal checks"
    ON legal_check_logs FOR SELECT
    USING (
        organization_id IN (
            SELECT id FROM organizations 
            WHERE id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
        )
    );

CREATE POLICY "System can insert legal checks"
    ON legal_check_logs FOR INSERT
    WITH CHECK (
        user_id = auth.uid() 
        AND organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
    );

-- ============================================================================
-- 5. Helper Function: Get Current Season Avatar
-- ============================================================================

CREATE OR REPLACE FUNCTION get_seasonal_avatar(
    p_entity_type TEXT,
    p_month INTEGER DEFAULT EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER
)
RETURNS TEXT AS $$
DECLARE
    v_season TEXT;
    v_profile RECORD;
BEGIN
    -- Determine season
    IF p_month IN (3, 4, 5) THEN
        v_season := 'spring';
    ELSIF p_month IN (6, 7, 8) THEN
        v_season := 'summer';
    ELSIF p_month IN (9, 10, 11) THEN
        v_season := 'autumn';
    ELSE
        v_season := 'winter';
    END IF;
    
    -- Get profile
    SELECT * INTO v_profile
    FROM assistant_profiles
    WHERE entity_type_key = p_entity_type;
    
    -- Return appropriate avatar URL
    RETURN CASE v_season
        WHEN 'spring' THEN v_profile.avatar_spring_url
        WHEN 'summer' THEN v_profile.avatar_summer_url
        WHEN 'autumn' THEN v_profile.avatar_autumn_url
        WHEN 'winter' THEN v_profile.avatar_winter_url
    END;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_seasonal_avatar IS 'Returns appropriate avatar URL based on current season (or specified month)';

-- ============================================================================
-- 6. Update Plan Limits for o1 Access
-- ============================================================================

ALTER TABLE plan_limits
ADD COLUMN IF NOT EXISTS max_o1_calls_per_month INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_precision_checks_per_month INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS enable_legal_advisor BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN plan_limits.max_o1_calls_per_month IS 'Maximum o1 API calls per month (expensive model)';
COMMENT ON COLUMN plan_limits.max_precision_checks_per_month IS 'Maximum times user can click precision check button';
COMMENT ON COLUMN plan_limits.enable_legal_advisor IS 'Can access o1-powered legal compliance checks';

-- Update existing plans
UPDATE plan_limits SET 
    max_o1_calls_per_month = 0,
    max_precision_checks_per_month = 0,
    enable_legal_advisor = FALSE
WHERE name = 'Free';

UPDATE plan_limits SET 
    max_o1_calls_per_month = 0,
    max_precision_checks_per_month = 5, -- Limited precision checks
    enable_legal_advisor = FALSE
WHERE name = 'Standard';

UPDATE plan_limits SET 
    max_o1_calls_per_month = 20,
    max_precision_checks_per_month = 50,
    enable_legal_advisor = TRUE
WHERE name = 'Pro';

UPDATE plan_limits SET 
    max_o1_calls_per_month = -1, -- Unlimited
    max_precision_checks_per_month = -1,
    enable_legal_advisor = TRUE
WHERE name = 'Enterprise';

-- ============================================================================
-- 7. Helper Function: Check o1 Quota
-- ============================================================================

CREATE OR REPLACE FUNCTION check_o1_quota(
    p_organization_id UUID
)
RETURNS TABLE (
    can_use BOOLEAN,
    used_this_month INTEGER,
    limit_per_month INTEGER,
    remaining INTEGER
) AS $$
DECLARE
    v_plan_name TEXT;
    v_limit INTEGER;
    v_used INTEGER;
BEGIN
    -- Get organization's plan
    SELECT pl.name, pl.max_o1_calls_per_month INTO v_plan_name, v_limit
    FROM organizations o
    JOIN plan_limits pl ON o.plan_id = pl.id
    WHERE o.id = p_organization_id;
    
    -- Count usage this month
    SELECT COUNT(*) INTO v_used
    FROM model_router_logs
    WHERE organization_id = p_organization_id
    AND selected_tier = 'advisor'
    AND created_at >= date_trunc('month', CURRENT_TIMESTAMP);
    
    -- Return results
    RETURN QUERY SELECT
        CASE 
            WHEN v_limit = -1 THEN TRUE -- Unlimited
            WHEN v_limit = 0 THEN FALSE -- Not allowed
            ELSE v_used < v_limit
        END as can_use,
        v_used as used_this_month,
        v_limit as limit_per_month,
        CASE 
            WHEN v_limit = -1 THEN 999999
            ELSE GREATEST(0, v_limit - v_used)
        END as remaining;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION check_o1_quota IS 'Check if organization can use o1 model (quota enforcement)';
