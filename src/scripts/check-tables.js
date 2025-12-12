
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkTables() {
    console.log('Checking tables...')

    const { error: knowledgeError } = await supabase.from('knowledge_items').select('count').limit(1)
    console.log('knowledge_items:', knowledgeError ? 'MISSING/ERROR' : 'EXISTS')
    if (knowledgeError) console.error(knowledgeError)

    const { error: templateError } = await supabase.from('document_templates').select('count').limit(1)
    console.log('document_templates:', templateError ? 'MISSING/ERROR' : 'EXISTS')
    if (templateError) console.error(templateError)
}

checkTables()
