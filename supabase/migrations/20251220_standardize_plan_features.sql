-- Standardize plan_limits.features for database-driven feature management
-- This migration ensures all plans have consistent feature keys

BEGIN;

-- Update FREE plan features
UPDATE plan_limits SET features = jsonb_build_object(
    'email_sending', false,
    'word_export', false,
    'long_term_memory', false,
    'audit_logs', false,
    'custom_domain', false,
    'priority_support', false
) WHERE plan_id = 'free';

-- Update STANDARD plan features  
UPDATE plan_limits SET features = jsonb_build_object(
    'email_sending', false,
    'word_export', true,
    'long_term_memory', true,
    'audit_logs', false,
    'custom_domain', false,
    'priority_support', false
) WHERE plan_id = 'standard';

-- Update PRO plan features
UPDATE plan_limits SET features = jsonb_build_object(
    'email_sending', true,
    'word_export', true,
    'long_term_memory', true,
    'audit_logs', true,
    'custom_domain', false,
    'priority_support', false
) WHERE plan_id = 'pro';

-- Update ENTERPRISE plan features (all features enabled)
UPDATE plan_limits SET features = jsonb_build_object(
    'email_sending', true,
    'word_export', true,
    'long_term_memory', true,
    'audit_logs', true,
    'custom_domain', true,
    'priority_support', true
) WHERE plan_id = 'enterprise';

COMMIT;
