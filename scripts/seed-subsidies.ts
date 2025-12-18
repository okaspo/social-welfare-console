import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// Helper to parse env file manually
function loadEnv() {
    try {
        const envPath = path.resolve('.env.local')
        // Try reading as utf16le which seems to be the case here
        let content = fs.readFileSync(envPath, 'utf16le')
        
        // Simple parser
        const env: Record<string, string> = {}
        content.split('\n').forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/)
            if (match) {
                const key = match[1].trim()
                const value = match[2].trim().replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1')
                env[key] = value
            }
        })
        return env
    } catch (e) {
        console.warn('Could not read .env.local', e)
        return {}
    }
}

const envConfig = loadEnv()

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || envConfig.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || envConfig.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing Supabase credentials')
    // Log what we found (masked)
    console.log('Found URL:', SUPABASE_URL ? 'Yes' : 'No')
    console.log('Found Key:', SUPABASE_SERVICE_ROLE_KEY ? 'Yes' : 'No')
    process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const MOCK_SUBSIDIES = [
    {
        title: 'IT導入補助金2025 (社会福祉法人枠)',
        provider: '経済産業省',
        description: '社会福祉法人が業務効率化のためにITツールを導入する際の費用を補助します。',
        target_entity_types: ['social_welfare'],
        target_regions: ['nationwide'],
        amount_min: 500000,
        amount_max: 4500000,
        application_deadline: '2025-08-31',
        source_url: 'https://example.com/it-hojo',
        is_active: true
    },
    {
        title: '介護ロボット導入支援事業',
        provider: '厚生労働省',
        description: '介護従事者の負担軽減に資する介護ロボットの導入を支援します。',
        target_entity_types: ['social_welfare', 'medical_corp'],
        target_regions: ['nationwide'],
        amount_min: 100000,
        amount_max: 3000000,
        application_deadline: '2025-12-20',
        source_url: 'https://example.com/kaigo-robot',
        is_active: true
    },
    {
        title: '地域福祉活動推進助成金',
        provider: '東京都福祉保健財団',
        description: '東京都内で地域福祉活動を行うNPO法人や社会福祉法人を対象とした助成金です。',
        target_entity_types: ['social_welfare', 'npo'],
        target_regions: ['tokyo'],
        amount_min: 50000,
        amount_max: 500000,
        application_deadline: '2025-05-15',
        source_url: 'https://example.com/tokyo-fukushi',
        is_active: true
    },
    {
        title: '小規模事業者持続化補助金 (一般型)',
        provider: '商工会議所',
        description: '小規模事業者が経営計画を作成して取り組む販路開拓等を支援します。',
        target_entity_types: ['general_inc', 'medical_corp'],
        target_regions: ['nationwide'],
        amount_min: 100000,
        amount_max: 2000000,
        application_deadline: '2025-06-10',
        source_url: 'https://example.com/jizoku',
        is_active: true
    }
]

async function seed() {
    console.log('Seeding subsidies...')

    for (const sub of MOCK_SUBSIDIES) {
        // Use upsert or match by title to avoid dupes?
        // Simpler: just insert
        const { error } = await supabase.from('subsidies').insert(sub)
        if (error) {
            console.error('Error inserting:', sub.title, error.message)
        } else {
            console.log('Inserted:', sub.title)
        }
    }
    console.log('Done.')
}

seed()
