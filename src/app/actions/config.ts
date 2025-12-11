'use server'

export async function checkEnvironmentConfig() {
    const missingvars = []

    if (!process.env.OPENAI_API_KEY) {
        missingvars.push('OPENAI_API_KEY')
    }
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
        missingvars.push('NEXT_PUBLIC_SUPABASE_URL')
    }
    if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        missingvars.push('NEXT_PUBLIC_SUPABASE_ANON_KEY')
    }

    return {
        isConfigured: missingvars.length === 0,
        missing: missingvars
    }
}
