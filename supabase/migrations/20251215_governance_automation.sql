-- Governance Automation System
-- Magic Link E-Consent & Auto-Minutes Generation
-- Date: 2025-12-15

-- ============================================================================
-- 1. Extend Meetings Table
-- ============================================================================

ALTER TABLE meetings
ADD COLUMN IF NOT EXISTS notification_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS meeting_type TEXT CHECK (meeting_type IN ('physical', 'hybrid', 'omission')) DEFAULT 'physical',
ADD COLUMN IF NOT EXISTS days_notice_required INTEGER DEFAULT 7,
ADD COLUMN IF NOT EXISTS auto_minutes_generated BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN meetings.notification_sent_at IS 'Timestamp when convocation notice was sent (legal requirement)';
COMMENT ON COLUMN meetings.meeting_type IS 'physical: In-person, hybrid: Mixed, omission: Written resolution (みなし決議)';
COMMENT ON COLUMN meetings.days_notice_required IS 'Required notice period from bylaws (default 7 days)';
COMMENT ON COLUMN meetings.auto_minutes_generated IS 'Flag to prevent duplicate auto-generation of minutes';

-- ============================================================================
-- 2. Add Email Field to Officers Table (if not exists)
-- ============================================================================

ALTER TABLE officers
ADD COLUMN IF NOT EXISTS email TEXT;

COMMENT ON COLUMN officers.email IS 'Officer email address for convocation notices';

-- ============================================================================
-- 3. Create Meeting Consents Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS meeting_consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE NOT NULL,
    officer_id UUID REFERENCES officers(id) ON DELETE CASCADE NOT NULL,
    
    -- Consent Status
    status TEXT CHECK (status IN ('pending', 'viewed', 'agreed', 'rejected')) DEFAULT 'pending' NOT NULL,
    
    -- Magic Link Security
    token TEXT UNIQUE NOT NULL,
    token_expires_at TIMESTAMPTZ NOT NULL,
    
    -- Response Tracking
    responded_at TIMESTAMPTZ,
    ip_address TEXT,
    user_agent TEXT,
    
    -- Audit Trail
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Ensure one consent record per officer per meeting
    UNIQUE(meeting_id, officer_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_meeting_consents_meeting ON meeting_consents(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_consents_token ON meeting_consents(token);
CREATE INDEX IF NOT EXISTS idx_meeting_consents_status ON meeting_consents(status);

-- Enable RLS
ALTER TABLE meeting_consents ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Organization members can view consents for their meetings
CREATE POLICY "Org members can view meeting consents" ON meeting_consents
    FOR SELECT
    USING (
        meeting_id IN (
            SELECT id FROM meetings 
            WHERE organization_id IN (
                SELECT organization_id FROM profiles WHERE id = auth.uid()
            )
        )
    );

-- System and admins can insert consents
CREATE POLICY "Admins can manage meeting consents" ON meeting_consents
    FOR INSERT
    WITH CHECK (
        meeting_id IN (
            SELECT id FROM meetings 
            WHERE organization_id IN (
                SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = 'admin'
            )
        )
    );

-- Public can update consents via magic link (token-based, no auth required)
CREATE POLICY "Public can update via token" ON meeting_consents
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Comments
COMMENT ON TABLE meeting_consents IS 'Tracks officer consent status for board meetings and written resolutions';
COMMENT ON COLUMN meeting_consents.token IS 'Secure random token for magic link authentication';
COMMENT ON COLUMN meeting_consents.status IS 'pending: Sent, viewed: Opened link, agreed: Consented, rejected: Refused';

-- ============================================================================
-- 4. Create Helper Function: Check All Consents and Trigger Auto-Minutes
-- ============================================================================

CREATE OR REPLACE FUNCTION check_and_trigger_auto_minutes()
RETURNS TRIGGER AS $$
DECLARE
    total_officers INT;
    agreed_officers INT;
    meeting_record RECORD;
BEGIN
    -- Get meeting details
    SELECT * INTO meeting_record 
    FROM meetings 
    WHERE id = NEW.meeting_id;
    
    -- Only process if meeting type is 'omission' and not already generated
    IF meeting_record.meeting_type != 'omission' OR meeting_record.auto_minutes_generated THEN
        RETURN NEW;
    END IF;
    
    -- Count total officers for this meeting
    SELECT COUNT(*) INTO total_officers
    FROM meeting_consents
    WHERE meeting_id = NEW.meeting_id;
    
    -- Count officers who agreed
    SELECT COUNT(*) INTO agreed_officers
    FROM meeting_consents
    WHERE meeting_id = NEW.meeting_id AND status = 'agreed';
    
    -- If all agreed, trigger auto-minutes generation (via notification or job)
    IF total_officers > 0 AND total_officers = agreed_officers THEN
        -- Update meeting to mark auto-minutes as generated
        UPDATE meetings
        SET auto_minutes_generated = TRUE
        WHERE id = NEW.meeting_id;
        
        -- Note: Actual minutes generation will be done by backend service
        -- This just sets the flag to trigger the process
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_auto_minutes ON meeting_consents;
CREATE TRIGGER trigger_auto_minutes
    AFTER UPDATE OF status ON meeting_consents
    FOR EACH ROW
    EXECUTE FUNCTION check_and_trigger_auto_minutes();

COMMENT ON FUNCTION check_and_trigger_auto_minutes IS 'Automatically checks if all officers agreed and flags meeting for auto-minutes generation';
