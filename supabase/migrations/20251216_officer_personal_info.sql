-- Officer Personal Information Management
-- Add sensitive data fields for regulatory compliance
-- Date: 2025-12-16

-- ============================================================================
-- 1. Extend Officers Table with Personal Information
-- ============================================================================

ALTER TABLE officers
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS is_remunerated BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS occupation TEXT;

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_officers_remuneration ON officers(is_remunerated);
CREATE INDEX IF NOT EXISTS idx_officers_dob ON officers(date_of_birth);

-- Add comments for documentation
COMMENT ON COLUMN officers.address IS 'PII: Officer residential address for official registry';
COMMENT ON COLUMN officers.date_of_birth IS 'PII: Date of birth for age verification and disqualification checks';
COMMENT ON COLUMN officers.is_remunerated IS 'Whether officer receives compensation (Social Welfare Act compliance)';
COMMENT ON COLUMN officers.occupation IS 'Officer occupation for status reporting (e.g., 自営業, 公務員)';

-- ============================================================================
-- 2. Create Helper Function: Calculate Age
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_age(birth_date DATE)
RETURNS INTEGER AS $$
BEGIN
    RETURN DATE_PART('year', AGE(CURRENT_DATE, birth_date))::INTEGER;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION calculate_age IS 'Calculates current age from date of birth';

-- ============================================================================
-- 3. Create Helper Function: Check Disqualification (Underage)
-- ============================================================================

CREATE OR REPLACE FUNCTION is_officer_qualified(birth_date DATE, officer_role TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    current_age INTEGER;
BEGIN
    -- Calculate age
    current_age := calculate_age(birth_date);
    
    -- Check minimum age requirements
    -- Directors (理事) and Auditors (監事): Must be 18+
    -- Council members (評議員): Typically 18+ (organization specific)
    IF officer_role IN ('director', 'auditor', 'council_member') THEN
        RETURN current_age >= 18;
    END IF;
    
    -- Default: qualified
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION is_officer_qualified IS 'Checks if officer meets age requirements per Social Welfare Act';

-- ============================================================================
-- 4. Enhanced RLS for PII Protection
-- ============================================================================

-- Note: Existing RLS policies allow org members to view officers
-- Consider adding audit logging for PII access in production

-- Create view for masked data (list view)
CREATE OR REPLACE VIEW officers_masked AS
SELECT 
    id,
    organization_id,
    name,
    role,
    term_start,
    term_end,
    -- Mask sensitive data
    CASE 
        WHEN address IS NOT NULL THEN '〒***-**** ********' 
        ELSE NULL 
    END AS address_masked,
    CASE 
        WHEN date_of_birth IS NOT NULL THEN TO_CHAR(date_of_birth, 'YYYY年MM月')
        ELSE NULL
    END AS birth_year_month,
    calculate_age(date_of_birth) AS age,
    is_remunerated,
    occupation,
    created_at,
    updated_at
FROM officers;

COMMENT ON VIEW officers_masked IS 'Masked view of officers for list displays (privacy-safe)';

-- Grant access to masked view (same as officers table)
ALTER VIEW officers_masked OWNER TO postgres;

-- ============================================================================
-- 5. Audit Logging Preparation
-- ============================================================================

-- Future: Log PII access to audit_logs table
-- Example trigger:
-- CREATE TRIGGER log_officer_pii_access
--     AFTER SELECT ON officers
--     FOR EACH STATEMENT
--     EXECUTE FUNCTION log_pii_access();

-- For now, this is a placeholder for future implementation
COMMENT ON TABLE officers IS 'Contains sensitive PII - all access should be audited in production';
