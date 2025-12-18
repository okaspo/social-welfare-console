-- Seed Data for Subsidies Feature

INSERT INTO public.subsidies (title, provider, description, target_entity_types, target_regions, amount_min, amount_max, application_deadline, source_url, is_active)
VALUES
    (
        'IT導入補助金2025 (社会福祉法人枠)',
        '経済産業省',
        '社会福祉法人が業務効率化のためにITツールを導入する際の費用を補助します。',
        '{social_welfare}',
        '{nationwide}',
        500000,
        4500000,
        '2025-08-31',
        'https://example.com/it-hojo',
        true
    ),
    (
        '介護ロボット導入支援事業',
        '厚生労働省',
        '介護従事者の負担軽減に資する介護ロボットの導入を支援します。',
        '{social_welfare,medical_corp}',
        '{nationwide}',
        100000,
        3000000,
        '2025-12-20',
        'https://example.com/kaigo-robot',
        true
    ),
    (
        '地域福祉活動推進助成金',
        '東京都福祉保健財団',
        '東京都内で地域福祉活動を行うNPO法人や社会福祉法人を対象とした助成金です。',
        '{social_welfare,npo}',
        '{tokyo}',
        50000,
        500000,
        '2025-05-15',
        'https://example.com/tokyo-fukushi',
        true
    ),
    (
        '小規模事業者持続化補助金 (一般型)',
        '商工会議所',
        '小規模事業者が経営計画を作成して取り組む販路開拓等を支援します。',
        '{general_inc,medical_corp}',
        '{nationwide}',
        100000,
        2000000,
        '2025-06-10',
        'https://example.com/jizoku',
        true
    )
ON CONFLICT DO NOTHING;
