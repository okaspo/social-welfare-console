-- Stripe Payment Integration
-- Add subscription billing fields to organizations
-- Date: 2025-12-16

-- ============================================================================
-- Organizations Table Extension for Stripe
-- ============================================================================

ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_status TEXT CHECK (subscription_status IN (
    'active', 'past_due', 'canceled', 'incomplete', 'trialing'
)) DEFAULT 'incomplete',
ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS payment_method TEXT; -- 'card', 'bank_transfer'

CREATE INDEX IF NOT EXISTS idx_organizations_stripe_customer ON organizations(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_organizations_stripe_subscription ON organizations(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_organizations_subscription_status ON organizations(subscription_status);

COMMENT ON COLUMN organizations.stripe_customer_id IS 'Stripe customer ID for billing';
COMMENT ON COLUMN organizations.stripe_subscription_id IS 'Active Stripe subscription ID';
COMMENT ON COLUMN organizations.subscription_status IS 'Current subscription status';
COMMENT ON COLUMN organizations.current_period_end IS 'Subscription renewal date';
COMMENT ON COLUMN organizations.payment_method IS 'Payment method used (card or bank_transfer)';

-- ============================================================================
-- Update existing free plan organizations
-- ============================================================================

UPDATE organizations
SET subscription_status = 'active'
WHERE plan_id IN ('free', 'Free')
AND subscription_status IS NULL;
