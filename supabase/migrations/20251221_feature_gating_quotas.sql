-- =============================================================================
-- Feature Gating & Quota Management Update
-- Implements strict plan-based feature flags and quota limits
-- =============================================================================

BEGIN;

-- =============================================================================
-- 1. Update plan_limits with spec-compliant feature flags
-- =============================================================================

-- Ensure monthly limits columns exist
ALTER TABLE plan_limits 
ADD COLUMN IF NOT EXISTS monthly_chat_limit INT DEFAULT 50,
ADD COLUMN IF NOT EXISTS monthly_doc_gen_limit INT DEFAULT 3;

-- Update FREE plan (Trial)
UPDATE plan_limits 
SET 
    monthly_chat_limit = 50,
    monthly_doc_gen_limit = 3,
    features = jsonb_build_object(
        'can_download_word', false,
        'has_long_term_memory', false,
        'has_risk_detection', false,
        'has_magic_link', false,
        'has_custom_domain', false,
        'has_audit_logs', false,
        'is_dedicated_support', false
    )
WHERE plan_id = 'free';

-- Update STANDARD plan (Basic)
UPDATE plan_limits 
SET 
    monthly_chat_limit = 500,
    monthly_doc_gen_limit = -1, -- Unlimited
    features = jsonb_build_object(
        'can_download_word', true,
        'has_long_term_memory', false,
        'has_risk_detection', false,
        'has_magic_link', false,
        'has_custom_domain', false,
        'has_audit_logs', false,
        'is_dedicated_support', false
    )
WHERE plan_id = 'standard';

-- Update PRO plan (Business - Core Product)
UPDATE plan_limits 
SET 
    monthly_chat_limit = -1, -- Unlimited
    monthly_doc_gen_limit = -1,
    features = jsonb_build_object(
        'can_download_word', true,
        'has_long_term_memory', true,
        'has_risk_detection', true,
        'has_magic_link', true,
        'has_custom_domain', true,
        'has_audit_logs', true,
        'is_dedicated_support', false
    )
WHERE plan_id = 'pro';

-- Update ENTERPRISE plan (Large Scale)
UPDATE plan_limits 
SET 
    monthly_chat_limit = -1,
    monthly_doc_gen_limit = -1,
    features = jsonb_build_object(
        'can_download_word', true,
        'has_long_term_memory', true,
        'has_risk_detection', true,
        'has_magic_link', true,
        'has_custom_domain', true,
        'has_audit_logs', true,
        'is_dedicated_support', true
    )
WHERE plan_id = 'enterprise';

-- =============================================================================
-- 2. Ensure organization_usage has doc_gen_count
-- =============================================================================

ALTER TABLE organization_usage
ADD COLUMN IF NOT EXISTS doc_gen_count INT DEFAULT 0;

COMMENT ON COLUMN organization_usage.doc_gen_count IS 'Number of documents generated this month (minutes, reports, etc.)';

-- =============================================================================
-- 3. Create helper function to check quota
-- =============================================================================

CREATE OR REPLACE FUNCTION check_doc_gen_quota(org_id UUID)
RETURNS JSON AS $$
DECLARE
    current_month TEXT := to_char(CURRENT_DATE, 'YYYY-MM');
    current_count INT := 0;
    doc_limit INT := 0;
    org_plan TEXT := 'free';
BEGIN
    -- Get organization plan
    SELECT COALESCE(plan, 'free') INTO org_plan
    FROM organizations WHERE id = org_id;
    
    -- Get plan limit
    SELECT COALESCE(monthly_doc_gen_limit, 3) INTO doc_limit
    FROM plan_limits WHERE plan_id = org_plan;
    
    -- Get current usage
    SELECT COALESCE(doc_gen_count, 0) INTO current_count
    FROM organization_usage 
    WHERE organization_id = org_id AND month = current_month;
    
    -- Check if quota exceeded (-1 means unlimited)
    IF doc_limit = -1 THEN
        RETURN json_build_object(
            'allowed', true,
            'current_count', current_count,
            'limit', -1,
            'remaining', -1
        );
    END IF;
    
    IF current_count >= doc_limit THEN
        RETURN json_build_object(
            'allowed', false,
            'current_count', current_count,
            'limit', doc_limit,
            'remaining', 0
        );
    END IF;
    
    RETURN json_build_object(
        'allowed', true,
        'current_count', current_count,
        'limit', doc_limit,
        'remaining', doc_limit - current_count
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 4. Create function to increment doc gen count
-- =============================================================================

CREATE OR REPLACE FUNCTION increment_doc_gen_count(org_id UUID)
RETURNS VOID AS $$
DECLARE
    current_month TEXT := to_char(CURRENT_DATE, 'YYYY-MM');
BEGIN
    INSERT INTO organization_usage (organization_id, month, doc_gen_count, chat_count)
    VALUES (org_id, current_month, 1, 0)
    ON CONFLICT (organization_id, month) 
    DO UPDATE SET doc_gen_count = organization_usage.doc_gen_count + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
