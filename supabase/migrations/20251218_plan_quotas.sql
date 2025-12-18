-- Migration: Add Pricing and Quotas to Plan Limits
-- Date: 2025-12-18

ALTER TABLE public.plan_limits
ADD COLUMN IF NOT EXISTS monthly_price_jpy INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS max_users INTEGER DEFAULT 5, -- Default to small team
ADD COLUMN IF NOT EXISTS max_monthly_chat INTEGER DEFAULT -1, -- -1 for unlimited
ADD COLUMN IF NOT EXISTS storage_limit_mb INTEGER DEFAULT 1024; -- 1GB default

-- Update seed data/defaults for existing plans (Optional but good for consistency)
UPDATE public.plan_limits SET monthly_price_jpy = 0, max_users = 3, max_monthly_chat = 100, storage_limit_mb = 100 WHERE plan_id = 'free';
UPDATE public.plan_limits SET monthly_price_jpy = 9800, max_users = 10000, max_monthly_chat = -1, storage_limit_mb = 10240 WHERE plan_id = 'standard'; -- Unlimited users effectively
UPDATE public.plan_limits SET monthly_price_jpy = 29800, max_users = 10000, max_monthly_chat = -1, storage_limit_mb = 102400 WHERE plan_id = 'pro';
UPDATE public.plan_limits SET monthly_price_jpy = 100000, max_users = 10000, max_monthly_chat = -1, storage_limit_mb = 1048576 WHERE plan_id = 'enterprise';
