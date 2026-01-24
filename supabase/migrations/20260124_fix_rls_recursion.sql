-- RLS無限再帰エラー修正 v2
-- Date: 2026-01-24
-- 問題: profiles RLSポリシーがサブクエリでprofilesを参照し無限再帰発生
-- 解決: SECURITY DEFINERファンクションを使用してRLSを回避
-- 注意: 関数名をrls_プレフィックス付きに変更して重複回避

-- ============================================================================
-- 1. ヘルパーファンクション作成 (SECURITY DEFINER = RLSをバイパス)
-- ============================================================================

-- 既存のファンクションを削除
DROP FUNCTION IF EXISTS public.rls_get_user_org_id(UUID);
DROP FUNCTION IF EXISTS public.rls_is_admin_user(UUID);
DROP FUNCTION IF EXISTS public.rls_meeting_in_user_org(UUID);

-- ユーザーの組織IDを取得するファンクション
CREATE FUNCTION public.rls_get_user_org_id(p_user_id UUID)
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT organization_id FROM public.profiles WHERE id = p_user_id LIMIT 1;
$$;

-- ユーザーが管理者かどうかを確認するファンクション
CREATE FUNCTION public.rls_is_admin_user(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS (SELECT 1 FROM public.admin_roles ar WHERE ar.user_id = p_user_id);
$$;

-- ============================================================================
-- 2. profiles RLSポリシー修正
-- ============================================================================

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Members can view colleagues" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- 新しいポリシーを作成（ヘルパーファンクション使用）
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT
    USING (id = auth.uid());

CREATE POLICY "Members can view colleagues" ON public.profiles
    FOR SELECT
    USING (
        organization_id IS NOT NULL
        AND organization_id = public.rls_get_user_org_id(auth.uid())
    );

CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT
    USING (public.rls_is_admin_user(auth.uid()));

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE
    USING (id = auth.uid());

-- ============================================================================
-- 3. feedbacks RLSポリシー修正
-- ============================================================================

DROP POLICY IF EXISTS "Org members read own feedbacks" ON public.feedbacks;
DROP POLICY IF EXISTS "Org members can insert feedbacks" ON public.feedbacks;

CREATE POLICY "Org members read own feedbacks" ON public.feedbacks
FOR SELECT USING (
    organization_id = public.rls_get_user_org_id(auth.uid())
    OR public.rls_is_admin_user(auth.uid())
);

CREATE POLICY "Org members can insert feedbacks" ON public.feedbacks
FOR INSERT WITH CHECK (
    organization_id = public.rls_get_user_org_id(auth.uid())
);

-- ============================================================================
-- 4. meeting_invitations RLSポリシー修正
-- ============================================================================

DROP POLICY IF EXISTS "Org members read invitations" ON public.meeting_invitations;
DROP POLICY IF EXISTS "Org members can insert invitations" ON public.meeting_invitations;

-- 会議が自組織に属するかを確認するファンクション
CREATE FUNCTION public.rls_meeting_in_user_org(p_meeting_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.meetings m
        JOIN public.profiles p ON p.id = m.user_id
        WHERE m.id = p_meeting_id
        AND p.organization_id = public.rls_get_user_org_id(auth.uid())
    );
$$;

CREATE POLICY "Org members read invitations" ON public.meeting_invitations
FOR SELECT USING (
    public.rls_meeting_in_user_org(meeting_id)
    OR public.rls_is_admin_user(auth.uid())
);

CREATE POLICY "Org members can insert invitations" ON public.meeting_invitations
FOR INSERT WITH CHECK (
    public.rls_meeting_in_user_org(meeting_id)
);

-- ============================================================================
-- 5. パーミッション設定
-- ============================================================================

GRANT EXECUTE ON FUNCTION public.rls_get_user_org_id(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rls_is_admin_user(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rls_meeting_in_user_org(UUID) TO authenticated;
