export const BILLING_CONFIG = {
    plans: {
        free: {
            id: 'free',
            name: 'Free Plan',
            description: '基本的な機能をお試しいただけます',
            priceId: {
                monthly: '',
                yearly: ''
            },
            features: [
                'AIチャット (GPT-4o mini)',
                '会議管理 (月1回まで)',
                '役員管理 (5名まで)'
            ]
        },
        standard: {
            id: 'standard',
            name: 'Standard Plan',
            description: '小規模法人向け。基本機能をフル活用',
            priceId: {
                monthly: process.env.STRIPE_PRICE_STANDARD_MONTHLY || 'price_standard_monthly_dummy',
                yearly: process.env.STRIPE_PRICE_STANDARD_YEARLY || 'price_standard_yearly_dummy'
            },
            features: [
                'AIチャット (GPT-4o)',
                '会議管理 (無制限)',
                '役員管理 (無制限)',
                '議事録自動生成',
                'メールサポート'
            ]
        },
        pro: {
            id: 'pro',
            name: 'Pro Plan',
            description: '大規模法人・複数施設向け',
            priceId: {
                monthly: process.env.STRIPE_PRICE_PRO_MONTHLY || 'price_pro_monthly_dummy',
                yearly: process.env.STRIPE_PRICE_PRO_YEARLY || 'price_pro_yearly_dummy'
            },
            features: [
                '専用AIモデル (o1)',
                '優先サポート',
                'カスタムドメイン',
                'APIアクセス',
                '専任担当者'
            ]
        }
    }
};
