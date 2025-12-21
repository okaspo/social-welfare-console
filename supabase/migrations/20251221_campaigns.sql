-- =============================================================================
-- Campaigns Table for Entity-Specific Invitations
-- =============================================================================

-- 1. Create campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    target_entity_type VARCHAR(50) NOT NULL DEFAULT 'social_welfare',
    discount_percent INTEGER DEFAULT 0 CHECK (discount_percent >= 0 AND discount_percent <= 100),
    target_plan VARCHAR(50) DEFAULT 'starter',
    max_uses INTEGER,
    current_uses INTEGER DEFAULT 0,
    starts_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create index for code lookups
CREATE INDEX IF NOT EXISTS idx_campaigns_code ON campaigns (code);
CREATE INDEX IF NOT EXISTS idx_campaigns_entity_type ON campaigns (target_entity_type, is_active);

-- 3. Enable RLS
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies - Super admins can manage campaigns
CREATE POLICY "Super admins can manage campaigns"
ON campaigns
FOR ALL
USING (is_super_admin())
WITH CHECK (is_super_admin());

-- 5. Public can verify campaign codes (for signup)
CREATE POLICY "Anyone can verify campaign codes"
ON campaigns
FOR SELECT
USING (is_active = true AND (expires_at IS NULL OR expires_at > NOW()));

-- 6. Track campaign usage in organizations
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS campaign_code VARCHAR(50) REFERENCES campaigns(code);

-- 7. Function to apply campaign on signup
CREATE OR REPLACE FUNCTION public.apply_campaign_code(p_code VARCHAR, p_org_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_campaign RECORD;
BEGIN
    -- Find active campaign
    SELECT * INTO v_campaign
    FROM campaigns
    WHERE code = UPPER(p_code)
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > NOW())
    AND (max_uses IS NULL OR current_uses < max_uses);

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired campaign code');
    END IF;

    -- Apply campaign to organization
    UPDATE organizations
    SET 
        entity_type = v_campaign.target_entity_type,
        campaign_code = v_campaign.code,
        plan = COALESCE(v_campaign.target_plan, plan)
    WHERE id = p_org_id;

    -- Increment usage counter
    UPDATE campaigns
    SET current_uses = current_uses + 1
    WHERE id = v_campaign.id;

    RETURN jsonb_build_object(
        'success', true,
        'entity_type', v_campaign.target_entity_type,
        'discount', v_campaign.discount_percent,
        'plan', v_campaign.target_plan
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.apply_campaign_code(VARCHAR, UUID) TO authenticated;
