-- Dynamic Branding, Engagement & Legal Safety
-- Date: 2025-12-16

-- ============================================================================
-- 1. Dynamic Avatar System
-- ============================================================================

CREATE TABLE IF NOT EXISTS assistant_avatars (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assistant_code TEXT NOT NULL, -- 'aoi', 'aki', 'ami'
    image_url TEXT NOT NULL,
    condition_type TEXT CHECK (condition_type IN (
        'default', 'season', 'emotion', 'event'
    )) DEFAULT 'default' NOT NULL,
    condition_value TEXT, -- 'spring', 'summer', 'happy', 'apology'
    active_period_start DATE,
    active_period_end DATE,
    priority INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_avatars_code ON assistant_avatars(assistant_code);
CREATE INDEX IF NOT EXISTS idx_avatars_period ON assistant_avatars(active_period_start, active_period_end);

COMMENT ON TABLE assistant_avatars IS 'Dynamic avatar images for AI assistants with seasonal/emotional variations';

-- Seed Data: Default and Seasonal Avatars
INSERT INTO assistant_avatars (assistant_code, image_url, condition_type, condition_value, priority) VALUES
-- Aoi (葵)
('aoi', '/avatars/aoi/default.png', 'default', NULL, 0),
('aoi', '/avatars/aoi/spring.png', 'season', 'spring', 1),
('aoi', '/avatars/aoi/summer.png', 'season', 'summer', 1),
('aoi', '/avatars/aoi/autumn.png', 'season', 'autumn', 1),
('aoi', '/avatars/aoi/winter.png', 'season', 'winter', 1),
('aoi', '/avatars/aoi/happy.png', 'emotion', 'happy', 2),
('aoi', '/avatars/aoi/thinking.png', 'emotion', 'thinking', 2),

-- Aki (秋)
('aki', '/avatars/aki/default.png', 'default', NULL, 0),
('aki', '/avatars/aki/spring.png', 'season', 'spring', 1),
('aki', '/avatars/aki/summer.png', 'season', 'summer', 1),

-- Ami (亜美)
('ami', '/avatars/ami/default.png', 'default', NULL, 0);

-- ============================================================================
-- 2. Daily Tweets (Engagement Content)
-- ============================================================================

CREATE TABLE IF NOT EXISTS daily_tweets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE UNIQUE NOT NULL,
    assistant_code TEXT DEFAULT 'aoi' NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    is_auto_generated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tweets_date ON daily_tweets(date DESC);

COMMENT ON TABLE daily_tweets IS 'Daily messages from AI assistants for user engagement';

-- Seed Data: Sample Daily Tweets
INSERT INTO daily_tweets (date, assistant_code, content, is_auto_generated) VALUES
('2025-04-01', 'aoi', '新年度ですね🌸 今年度も法人運営をしっかりサポートします！', false),
('2025-07-01', 'aoi', '暑い日が続きますね。熱中症には気をつけてくださいね💧', false),
('2025-12-31', 'aoi', '今年もお疲れさまでした。甘いものでも食べて、ゆっくり休んでくださいね🍰', false);

-- ============================================================================
-- 3. User Feedback System
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    category TEXT CHECK (category IN (
        'feature_request', 'bug', 'usability', 'other'
    )) DEFAULT 'other' NOT NULL,
    content TEXT NOT NULL,
    status TEXT CHECK (status IN (
        'new', 'reviewing', 'planned', 'implemented', 'declined'
    )) DEFAULT 'new' NOT NULL,
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_feedback_status ON user_feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_category ON user_feedback(category);
CREATE INDEX IF NOT EXISTS idx_feedback_user ON user_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_created ON user_feedback(created_at DESC);

COMMENT ON TABLE user_feedback IS 'User feedback and feature requests collected via AI chat';

-- RLS Policies
ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own feedback"
    ON user_feedback FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can create feedback"
    ON user_feedback FOR INSERT
    WITH CHECK (user_id = auth.uid());
