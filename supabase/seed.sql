-- ==========================================
-- GovAI Console: Seed Data
-- ==========================================
-- This file is automatically executed by Supabase when resetting the database
-- or can be run manually to ensure initial data presence.

-- 1. Plan Limits
INSERT INTO public.plan_limits (id, name, o1_monthly_quota, precision_check_quota, ai_chat_enabled, word_export_enabled, email_sending_enabled, subsidy_matching_enabled)
VALUES 
  ('free', 'Free', 0, 0, true, false, false, false),
  ('standard', 'Standard', 10, 10, true, false, true, false),
  ('pro', 'Pro', 50, 50, true, true, true, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  o1_monthly_quota = EXCLUDED.o1_monthly_quota,
  precision_check_quota = EXCLUDED.precision_check_quota,
  ai_chat_enabled = EXCLUDED.ai_chat_enabled,
  word_export_enabled = EXCLUDED.word_export_enabled,
  email_sending_enabled = EXCLUDED.email_sending_enabled,
  subsidy_matching_enabled = EXCLUDED.subsidy_matching_enabled;

-- 2. Assistant Profiles (葵/秋/亜美)
INSERT INTO public.assistant_profiles (
  name,
  entity_type,
  color_primary,
  color_secondary,
  personality_traits,
  expertise_areas,
  greeting_message
) VALUES
(
  '葵',
  'social_welfare',
  '#3B82F6',
  '#93C5FD',
  '["丁寧", "知的", "温かい", "信頼できる"]',
  '["社会福祉法", "理事会運営", "補助金申請", "会計監査"]',
  'こんにちは。社会福祉法人を支援するAIアシスタント、葵です。法務・会計・補助金など、何でもお気軽にご相談ください。'
),
(
  '秋',
  'npo',
  '#F97316',
  '#FED7AA',
  '["エネルギッシュ", "親しみやすい", "実践的", "柔軟"]',
  '["NPO法", "寄付管理", "イベント企画", "広報戦略"]',
  'やあ！NPO法人をサポートするアシスタント、秋だよ。活動の悩みや運営のこと、なんでも相談してね！'
),
(
  '亜美',
  'medical',
  '#10B981',
  '#A7F3D0',
  '["冷静", "論理的", "正確", "プロフェッショナル"]',
  '["医療法", "診療報酬", "医療安全", "施設基準"]',
  'こんにちは。医療法人専門AIアシスタントの亜美です。医療法務や診療報酬など、専門的なご質問にお答えします。'
)
ON CONFLICT (entity_type) DO UPDATE SET
  name = EXCLUDED.name,
  color_primary = EXCLUDED.color_primary,
  color_secondary = EXCLUDED.color_secondary,
  personality_traits = EXCLUDED.personality_traits,
  expertise_areas = EXCLUDED.expertise_areas,
  greeting_message = EXCLUDED.greeting_message;

-- 3. Initial Subsidies Data
INSERT INTO public.subsidies (
  title, 
  provider, 
  category, 
  amount_min, 
  amount_max,
  application_period_start,
  application_period_end,
  target_entity_types,
  target_business_types,
  requirements,
  is_active
) VALUES 
(
  '高齢者福祉施設整備補助金',
  '厚生労働省',
  '施設整備',
  5000000, 
  50000000,
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '6 months',
  ARRAY['social_welfare'],
  ARRAY['高齢者福祉', '介護サービス'],
  '{"建築基準": "新築または大規模改修", "対象施設": "特別養護老人ホーム、デイサービスセンター等"}',
  true
),
(
  'NPO法人活動支援助成金',
  '内閣府',
  '活動支援',
  1000000, 
  10000000,
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '3 months',
  ARRAY['npo'],
  ARRAY['地域福祉', '子育て支援'],
  '{"活動実績": "1年以上", "対象事業": "地域貢献活動"}',
  true
),
(
  '医療法人デジタル化推進補助金',
  '厚生労働省',
  'DX推進',
  2000000,
  15000000,
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '4 months',
  ARRAY['medical'],
  ARRAY['病院', 'クリニック'],
  '{"対象": "電子カルテ導入、オンライン診療システム"}',
  true
),
(
  '社会福祉法人職員研修支援金',
  '東京都',
  '人材育成',
  500000,
  3000000,
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '2 months',
  ARRAY['social_welfare'],
  ARRAY['全事業'],
  '{"対象": "職員研修費用、資格取得支援"}',
  true
)
ON CONFLICT DO NOTHING;
