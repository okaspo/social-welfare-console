-- Seed Data for Subsidies
INSERT INTO public.subsidies (title, provider, category, target_entity_types, target_regions, target_business_types, amount_min, amount_max, requirements, source_url, application_period_end) 
VALUES 
(
    'IT導入補助金2025 (通常枠)', 
    '経済産業省', 
    'operation', 
    ARRAY['social_welfare', 'npo', 'medical_corp', 'general_inc'], 
    ARRAY['all'], 
    ARRAY['all'], 
    500000, 
    4500000, 
    '{"required_years": 1, "profit_increase_plan": true}'::jsonb, 
    'https://it-shien.smrj.go.jp/', 
    '2026-03-31'
),
(
    '東京都 社会福祉施設等施設整備費補助金', 
    '東京都', 
    'equipment', 
    ARRAY['social_welfare'], 
    ARRAY['tokyo'], 
    ARRAY['elderly_care', 'disability'], 
    10000000, 
    100000000, 
    '{"required_years": 3, "location": "tokyo"}'::jsonb, 
    'https://www.fukushihoken.metro.tokyo.lg.jp/', 
    '2026-06-30'
),
(
    '介護ロボット導入支援事業', 
    '厚生労働省', 
    'equipment', 
    ARRAY['social_welfare', 'medical_corp'], 
    ARRAY['all'], 
    ARRAY['elderly_care'], 
    100000, 
    3000000, 
    '{"robot_type": "nursing_support"}'::jsonb, 
    'https://www.mhlw.go.jp/', 
    '2025-12-31'
),
(
    '大阪府 NPO活動基盤強化助成金', 
    '大阪府', 
    'operation', 
    ARRAY['npo'], 
    ARRAY['osaka'], 
    ARRAY['all'], 
    100000, 
    500000, 
    '{"npo_certified": true}'::jsonb, 
    'https://www.pref.osaka.lg.jp/', 
    '2026-01-15'
),
(
    '人材開発支援助成金 (人材育成支援コース)', 
    '厚生労働省', 
    'hr', 
    ARRAY['social_welfare', 'npo', 'medical_corp', 'general_inc'], 
    ARRAY['all'], 
    ARRAY['all'], 
    100000, 
    10000000, 
    '{"training_hours_min": 10}'::jsonb, 
    'https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/koyou_roudou/koyou/kyufukin/d01-1.html', 
    '2026-03-31'
);
