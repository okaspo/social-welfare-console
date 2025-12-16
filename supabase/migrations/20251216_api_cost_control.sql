-- API Cost Control & Usage Limiting System
-- Keep API costs under 15% of revenue through usage tracking and model routing
-- Date: 2025-12-16

-- ============================================================================
-- 1. Usage Logs (Cost Tracking)
-- ============================================================================

CREATE TABLE IF NOT EXISTS usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Feature tracking
    feature_name TEXT NOT NULL, -- 'chat', 'summarize_pdf', 'generate_minutes', 'email_batch'
    
    -- Model & Token usage
    model_used TEXT NOT NULL, -- 'gpt-4o', 'gpt-4o-mini', 'text-embedding-3-small'
    input_tokens INTEGER NOT NULL DEFAULT 0,
    output_tokens INTEGER NOT NULL DEFAULT 0,
    
    -- Cost calculation
    estimated_cost_usd NUMERIC(10, 6) NOT NULL DEFAULT 0, -- Up to $9999.999999
    
    -- Metadata
    request_metadata JSONB, -- Additional context (e.g., file size, conversation ID)
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_usage_logs_org ON usage_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_created ON usage_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_logs_org_month ON usage_logs(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_logs_feature ON usage_logs(feature_name);

COMMENT ON TABLE usage_logs IS 'Token usage and cost tracking for AI API calls';
COMMENT ON COLUMN usage_logs.estimated_cost_usd IS 'Calculated cost based on model pricing and token count';

-- ============================================================================
-- 2. Plan Limits Update (Cost Controls)
-- ============================================================================

ALTER TABLE plan_limits
ADD COLUMN IF NOT EXISTS max_monthly_cost_usd NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS allowed_models TEXT[] DEFAULT ARRAY['gpt-4o-mini'],
ADD COLUMN IF NOT EXISTS max_file_upload_size_mb INTEGER DEFAULT 5;

COMMENT ON COLUMN plan_limits.max_monthly_cost_usd IS 'Maximum API cost per month (USD). 0 = pay-as-you-go with fair use';
COMMENT ON COLUMN plan_limits.allowed_models IS 'Models this plan can access';
COMMENT ON COLUMN plan_limits.max_file_upload_size_mb IS 'Maximum file size for uploads (MB)';

-- Update existing plans with cost limits
UPDATE plan_limits SET 
    max_monthly_cost_usd = 0, -- Free tier: no AI features
    allowed_models = ARRAY[]::TEXT[],
    max_file_upload_size_mb = 1
WHERE name = 'Free';

UPDATE plan_limits SET 
    max_monthly_cost_usd = 10.00, -- Standard: $10/month API budget
    allowed_models = ARRAY['gpt-4o-mini', 'text-embedding-3-small'],
    max_file_upload_size_mb = 10
WHERE name = 'Standard';

UPDATE plan_limits SET 
    max_monthly_cost_usd = 0, -- Pro: Fair use policy (no hard limit, but monitor abuse)
    allowed_models = ARRAY['gpt-4o', 'gpt-4o-mini', 'text-embedding-3-small'],
    max_file_upload_size_mb = 50
WHERE name = 'Pro';

UPDATE plan_limits SET 
    max_monthly_cost_usd = 0, -- Enterprise: Unlimited
    allowed_models = ARRAY['gpt-4o', 'gpt-4o-mini', 'o1-preview', 'text-embedding-3-small'],
    max_file_upload_size_mb = 100
WHERE name = 'Enterprise';

-- ============================================================================
-- 3. Helper Function: Get Monthly Usage Cost
-- ============================================================================

CREATE OR REPLACE FUNCTION get_monthly_usage_cost(p_organization_id UUID)
RETURNS NUMERIC AS $$
BEGIN
    RETURN (
        SELECT COALESCE(SUM(estimated_cost_usd), 0)
        FROM usage_logs
        WHERE organization_id = p_organization_id
        AND created_at >= date_trunc('month', CURRENT_TIMESTAMP)
    );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_monthly_usage_cost IS 'Returns total API cost for current month (USD)';

-- ============================================================================
-- 4. Helper Function: Check Usage Limit
-- ============================================================================

CREATE OR REPLACE FUNCTION check_usage_limit(
    p_organization_id UUID,
    p_plan_name TEXT
)
RETURNS TABLE (
    has_exceeded BOOLEAN,
    current_cost NUMERIC,
    limit_cost NUMERIC,
    usage_percent NUMERIC
) AS $$
DECLARE
    v_current_cost NUMERIC;
    v_limit NUMERIC;
BEGIN
    -- Get current month cost
    v_current_cost := get_monthly_usage_cost(p_organization_id);
    
    -- Get plan limit
    SELECT max_monthly_cost_usd INTO v_limit
    FROM plan_limits
    WHERE name = p_plan_name;
    
    -- Return results
    RETURN QUERY SELECT
        CASE 
            WHEN v_limit > 0 THEN v_current_cost >= v_limit
            ELSE FALSE -- No limit (Pro/Enterprise)
        END as has_exceeded,
        v_current_cost as current_cost,
        v_limit as limit_cost,
        CASE 
            WHEN v_limit > 0 THEN (v_current_cost / v_limit * 100)
            ELSE 0
        END as usage_percent;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION check_usage_limit IS 'Check if organization has exceeded monthly usage limit';
