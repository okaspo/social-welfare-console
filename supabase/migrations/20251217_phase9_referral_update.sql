-- Add tracking column to organization
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS referred_by_code TEXT;

-- Add stats columns to referrals (Master Table)
ALTER TABLE referrals
ADD COLUMN IF NOT EXISTS referral_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS reward_total INTEGER DEFAULT 0;

-- Index for lookup
CREATE INDEX IF NOT EXISTS idx_organizations_referred_by ON organizations(referred_by_code);
