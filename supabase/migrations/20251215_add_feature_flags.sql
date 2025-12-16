-- Add new feature flags to plan_limits for future features
-- Date: 2025-12-15

-- Update existing plans to include new feature flags
UPDATE public.plan_limits 
SET features = features || jsonb_build_object(
    'can_use_custom_domain', 
    CASE 
        WHEN plan_id IN ('pro', 'enterprise') THEN true 
        ELSE false 
    END,
    'can_send_email', true,
    'can_view_audit_logs',
    CASE 
        WHEN plan_id IN ('pro', 'enterprise') THEN true 
        ELSE false 
    END
)
WHERE plan_id IN ('free', 'standard', 'pro', 'enterprise');
