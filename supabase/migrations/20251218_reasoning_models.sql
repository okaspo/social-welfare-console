-- Reasoning Model Limits
-- Date: 2025-12-18

-- 1. Add reasoning_monthly_limit to plan_limits
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'plan_limits' AND column_name = 'reasoning_monthly_limit') THEN
        ALTER TABLE public.plan_limits ADD COLUMN reasoning_monthly_limit INTEGER DEFAULT 0;
    END IF;
END $$;

-- 2. Update Plan Limits
-- FREE: No reasoning access
UPDATE public.plan_limits
SET 
    reasoning_monthly_limit = 0,
    allowed_models = array_append(allowed_models, 'gpt-4o-mini') -- Ensure mini is there (idempotent-ish)
WHERE plan_id = 'FREE';

-- STANDARD: No reasoning access
UPDATE public.plan_limits
SET 
    reasoning_monthly_limit = 0
WHERE plan_id = 'STANDARD';

-- PRO: 50 reasoning calls / month
UPDATE public.plan_limits
SET 
    reasoning_monthly_limit = 50,
    allowed_models = array_cat(allowed_models, ARRAY['o1-preview']) -- Add o1
WHERE plan_id = 'PRO';

-- ENTERPRISE: 500 reasoning calls / month
UPDATE public.plan_limits
SET 
    reasoning_monthly_limit = 500,
    allowed_models = array_cat(allowed_models, ARRAY['o1-preview'])
WHERE plan_id = 'ENTERPRISE';

-- Ensure uniqueness in allowed_models (Cleanup)
-- UPDATE public.plan_limits SET allowed_models = ARRAY(SELECT DISTINCT UNNEST(allowed_models));
