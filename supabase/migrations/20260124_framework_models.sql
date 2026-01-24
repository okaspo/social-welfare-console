-- Master Prompt Framework Models
-- Date: 2026-01-24
-- Description: Add SystemSetting, EmailLog, Feedback, and MeetingInvitation models

-- ============================================================================
-- 1. SystemSetting (メンテナンスモード、システム設定用)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.system_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL DEFAULT '{}',
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 初期データ: メンテナンスモードをOFF
INSERT INTO public.system_settings (key, value, description)
VALUES ('maintenance_mode', '{"enabled": false, "message": "メンテナンス中です。しばらくお待ちください。"}'::jsonb, 'システムメンテナンスモード設定')
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- 2. EmailLog (Resend送信ログ)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.email_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    to_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('sent', 'failed', 'simulated')),
    resend_id TEXT,
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON public.email_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON public.email_logs(status);

-- ============================================================================
-- 3. Feedback (ユーザーフィードバック)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.feedbacks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('bug', 'feature', 'general')),
    content TEXT NOT NULL,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'reviewed', 'resolved')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedbacks_org ON public.feedbacks(organization_id);
CREATE INDEX IF NOT EXISTS idx_feedbacks_status ON public.feedbacks(status);

-- ============================================================================
-- 4. MeetingInvitation (理事出席確認)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.meeting_invitations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
    officer_id UUID NOT NULL REFERENCES public.officers(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    invited_at TIMESTAMPTZ DEFAULT NOW(),
    responded_at TIMESTAMPTZ,
    response TEXT CHECK (response IN ('attending', 'absent', 'proxy')),
    proxy_name TEXT,
    email_log_id UUID REFERENCES public.email_logs(id),
    UNIQUE(meeting_id, officer_id)
);

CREATE INDEX IF NOT EXISTS idx_meeting_invitations_token ON public.meeting_invitations(token);
CREATE INDEX IF NOT EXISTS idx_meeting_invitations_meeting ON public.meeting_invitations(meeting_id);

-- ============================================================================
-- RLS Policies
-- ============================================================================

-- System Settings
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read system_settings" ON public.system_settings
FOR SELECT USING (true);

CREATE POLICY "Admin can update system_settings" ON public.system_settings
FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.admin_roles WHERE user_id = auth.uid())
);

-- Email Logs
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin read email_logs" ON public.email_logs
FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.admin_roles WHERE user_id = auth.uid())
);

CREATE POLICY "Service role can insert email_logs" ON public.email_logs
FOR INSERT WITH CHECK (true);

-- Feedbacks
ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members read own feedbacks" ON public.feedbacks
FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.admin_roles WHERE user_id = auth.uid())
);

CREATE POLICY "Org members can insert feedbacks" ON public.feedbacks
FOR INSERT WITH CHECK (
    organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
);

-- Meeting Invitations
ALTER TABLE public.meeting_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members read invitations" ON public.meeting_invitations
FOR SELECT USING (
    meeting_id IN (
        SELECT m.id FROM public.meetings m
        JOIN public.profiles p ON p.id = m.user_id
        WHERE p.organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
    )
    OR EXISTS (SELECT 1 FROM public.admin_roles WHERE user_id = auth.uid())
);

CREATE POLICY "Org members can insert invitations" ON public.meeting_invitations
FOR INSERT WITH CHECK (
    meeting_id IN (
        SELECT m.id FROM public.meetings m
        JOIN public.profiles p ON p.id = m.user_id
        WHERE p.organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
    )
);

CREATE POLICY "Anyone can update invitation by token" ON public.meeting_invitations
FOR UPDATE USING (true);

-- ============================================================================
-- Comments
-- ============================================================================
COMMENT ON TABLE public.system_settings IS 'システム設定（メンテナンスモード等）';
COMMENT ON TABLE public.email_logs IS 'メール送信ログ（Resend経由）';
COMMENT ON TABLE public.feedbacks IS 'ユーザーフィードバック';
COMMENT ON TABLE public.meeting_invitations IS '理事会出席確認招待';

COMMENT ON COLUMN public.meeting_invitations.token IS 'ワンクリック回答用のユニークトークン';
COMMENT ON COLUMN public.meeting_invitations.response IS 'attending=出席, absent=欠席, proxy=委任';
