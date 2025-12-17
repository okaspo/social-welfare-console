ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS referral_rewarded BOOLEAN DEFAULT false;
