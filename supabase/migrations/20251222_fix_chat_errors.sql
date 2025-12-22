-- Create check_usage_limit function wrapper for quota checking
CREATE OR REPLACE FUNCTION public.check_usage_limit(
    p_organization_id UUID,
    p_plan_name TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_limit BIGINT;
    v_current BIGINT;
    v_allowed BOOLEAN;
BEGIN
    -- Get plan limit (default to 10 if not found)
    SELECT monthly_chat_limit INTO v_limit
    FROM plan_limits
    WHERE plan_id = p_plan_name;
    
    IF v_limit IS NULL THEN
        -- Fallback for unknown plans
        v_limit := 10;
    END IF;

    -- Get current usage from organization_usage table (using chat_count column)
    SELECT COALESCE(chat_count, 0)
    INTO v_current 
    FROM organization_usage
    WHERE organization_id = p_organization_id
    AND current_month = date_trunc('month', now())::date;

    -- If no record found, default to 0
    IF v_current IS NULL THEN
        v_current := 0;
    END IF;

    -- Check if under limit (-1 means unlimited)
    IF v_limit = -1 THEN
        v_allowed := true;
    ELSE
        v_allowed := v_current < v_limit;
    END IF;

    RETURN jsonb_build_object(
        'allowed', v_allowed,
        'limit', v_limit,
        'currentCost', v_current
    );
END;
$$;

-- Add slug column to prompt_modules if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'prompt_modules' 
        AND column_name = 'slug'
    ) THEN
        ALTER TABLE prompt_modules ADD COLUMN slug TEXT;
        ALTER TABLE prompt_modules ADD CONSTRAINT prompt_modules_slug_unique UNIQUE (slug);
    END IF;
END $$;
