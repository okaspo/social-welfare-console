-- Migration: Add Subscription Lifecycle Columns to Organizations
-- Date: 2025-12-17
-- Description: Adds fields to track Stripe subscription status, cancellation intent, and grace period.

ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS subscription_status TEXT CHECK (subscription_status IN ('active', 'canceled', 'past_due', 'unpaid', 'trialing', 'incomplete', 'incomplete_expired')),
ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS grace_period_end TIMESTAMP WITH TIME ZONE;

-- Add comment for clarity
COMMENT ON COLUMN public.organizations.subscription_status IS 'Stripe subscription status';
COMMENT ON COLUMN public.organizations.cancel_at_period_end IS 'True if the user has requested cancellation at the end of the current period';
COMMENT ON COLUMN public.organizations.grace_period_end IS 'Date when the grace period for payment failure ends';
