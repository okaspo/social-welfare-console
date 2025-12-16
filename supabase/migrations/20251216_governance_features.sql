-- Governance Management: Conflict of Interest, Concurrent Posts & Training
-- Date: 2025-12-16

-- ============================================================================
-- 1. Officer Relationships Table (Conflict of Interest)
-- ============================================================================

CREATE TABLE IF NOT EXISTS officer_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    officer_id_a UUID REFERENCES officers(id) ON DELETE CASCADE NOT NULL,
    officer_id_b UUID REFERENCES officers(id) ON DELETE CASCADE NOT NULL,
    
    -- Relationship Type
    relationship_type TEXT CHECK (relationship_type IN (
        'spouse',              -- 配偶者
        'parent',              -- 親
        'child',               -- 子
        'sibling',             -- 兄弟姉妹
        'grandparent',         -- 祖父母
        'grandchild',          -- 孫
        'relative_3rd_degree', -- 3親等以内の親族
        'in_law',              -- 姻族
        'business_partner'     -- 事業上の特殊関係
    )) NOT NULL,
    
    -- Additional Info
    notes TEXT,
    
    -- Audit Trail
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Ensure A is always less than B (prevent duplicates A-B and B-A)
    CHECK (officer_id_a < officer_id_b),
    UNIQUE(officer_id_a, officer_id_b, organization_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_officer_relationships_org ON officer_relationships(organization_id);
CREATE INDEX IF NOT EXISTS idx_officer_relationships_officer_a ON officer_relationships(officer_id_a);
CREATE INDEX IF NOT EXISTS idx_officer_relationships_officer_b ON officer_relationships(officer_id_b);

-- RLS Policies
ALTER TABLE officer_relationships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members view relationships" ON officer_relationships
    FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Admins manage relationships" ON officer_relationships
    FOR ALL
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = 'admin'
        )
    );

COMMENT ON TABLE officer_relationships IS 'Tracks family and special relationships for conflict of interest detection';
COMMENT ON COLUMN officer_relationships.relationship_type IS 'Type of relationship for compliance checking';

-- ============================================================================
-- 2. Officer Concurrent Posts Table (兼職情報)
-- ============================================================================

CREATE TABLE IF NOT EXISTS officer_concurrent_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    officer_id UUID REFERENCES officers(id) ON DELETE CASCADE NOT NULL,
    
    -- External Organization Info
    organization_name TEXT NOT NULL,
    post_name TEXT NOT NULL,
    organization_type TEXT,
    
    -- Compensation
    is_paid BOOLEAN DEFAULT FALSE NOT NULL,
    monthly_compensation INTEGER,
    
    -- Period
    start_date DATE NOT NULL,
    end_date DATE,
    
    -- Notes
    notes TEXT,
    
    -- Audit Trail
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_concurrent_posts_officer ON officer_concurrent_posts(officer_id);
CREATE INDEX IF NOT EXISTS idx_concurrent_posts_active ON officer_concurrent_posts(end_date) WHERE end_date IS NULL;

-- RLS Policies
ALTER TABLE officer_concurrent_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View own org concurrent posts" ON officer_concurrent_posts
    FOR SELECT
    USING (
        officer_id IN (
            SELECT id FROM officers WHERE organization_id IN (
                SELECT organization_id FROM profiles WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Admins manage concurrent posts" ON officer_concurrent_posts
    FOR ALL
    USING (
        officer_id IN (
            SELECT id FROM officers WHERE organization_id IN (
                SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = 'admin'
            )
        )
    );

COMMENT ON TABLE officer_concurrent_posts IS 'Tracks officer roles in other organizations for status reporting';
COMMENT ON COLUMN officer_concurrent_posts.is_paid IS 'Whether officer receives compensation for this role';

-- ============================================================================
-- 3. Officer Training Records Table (研修履歴)
-- ============================================================================

CREATE TABLE IF NOT EXISTS officer_training_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    officer_id UUID REFERENCES officers(id) ON DELETE CASCADE NOT NULL,
    
    -- Training Details
    training_date DATE NOT NULL,
    title TEXT NOT NULL,
    organizer TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 0,
    
    -- Documentation
    report_file_url TEXT,
    certificate_file_url TEXT,
    
    -- Attendance
    attendance_status TEXT CHECK (attendance_status IN (
        'attended',
        'absent',
        'excused'
    )) DEFAULT 'attended',
    
    -- Notes
    notes TEXT,
    
    -- Audit Trail
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_training_records_org ON officer_training_records(organization_id);
CREATE INDEX IF NOT EXISTS idx_training_records_officer ON officer_training_records(officer_id);
CREATE INDEX IF NOT EXISTS idx_training_records_date ON officer_training_records(training_date DESC);

-- RLS Policies
ALTER TABLE officer_training_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View own org training" ON officer_training_records
    FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Admins manage training records" ON officer_training_records
    FOR ALL
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = 'admin'
        )
    );

COMMENT ON TABLE officer_training_records IS 'Officer training participation records for compliance verification';
COMMENT ON COLUMN officer_training_records.duration_minutes IS 'Training duration in minutes for compliance tracking';

-- ============================================================================
-- 4. Helper Function: Check Relative Ratio Compliance (1/3 Rule)
-- ============================================================================

CREATE OR REPLACE FUNCTION check_relative_ratio_compliance(org_id UUID)
RETURNS TABLE (
    total_directors INTEGER,
    related_directors INTEGER,
    max_allowed INTEGER,
    is_compliant BOOLEAN,
    violation_message TEXT
) AS $$
DECLARE
    v_total INTEGER;
    v_related INTEGER;
    v_max_allowed INTEGER;
    v_compliant BOOLEAN;
    v_message TEXT;
BEGIN
    -- Count total active directors
    SELECT COUNT(*) INTO v_total
    FROM officers
    WHERE organization_id = org_id
      AND role = 'director'
      AND status = 'active';
    
    -- Count directors with any relationships
    SELECT COUNT(DISTINCT officer_id) INTO v_related
    FROM (
        SELECT officer_id_a AS officer_id
        FROM officer_relationships
        WHERE organization_id = org_id
        UNION
        SELECT officer_id_b AS officer_id
        FROM officer_relationships
        WHERE organization_id = org_id
    ) related_officers
    WHERE officer_id IN (
        SELECT id FROM officers WHERE role = 'director' AND status = 'active'
    );
    
    -- Calculate max allowed (floor of 1/3)
    v_max_allowed := FLOOR(v_total / 3.0);
    
    -- Check compliance
    v_compliant := v_related <= v_max_allowed;
    
    -- Generate message
    IF v_compliant THEN
        v_message := NULL;
    ELSE
        v_message := format(
            '親族関係にある理事が %s 名（上限: %s 名）のため、社会福祉法第45条の13に違反しています。',
            v_related,
            v_max_allowed
        );
    END IF;
    
    RETURN QUERY SELECT v_total, v_related, v_max_allowed, v_compliant, v_message;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION check_relative_ratio_compliance IS 'Checks Social Welfare Act Article 45-13 compliance (max 1/3 related directors)';

-- ============================================================================
-- 5. Helper Function: Get Officer Training Hours (Annual)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_officer_training_hours(
    p_officer_id UUID,
    p_year INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER
)
RETURNS INTEGER AS $$
DECLARE
    total_hours INTEGER;
BEGIN
    SELECT COALESCE(SUM(duration_minutes), 0) / 60
    INTO total_hours
    FROM officer_training_records
    WHERE officer_id = p_officer_id
      AND EXTRACT(YEAR FROM training_date) = p_year
      AND attendance_status = 'attended';
    
    RETURN total_hours;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_officer_training_hours IS 'Calculates total training hours for an officer in a given year';
