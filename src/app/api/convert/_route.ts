import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
// We cannot use the Server Action directly if it expects FormData from a form submission context,
// but we can adapt the logic or use a library directly here.
// Since we have the file path in Supabase Storage, we should download it and process it.

import mammoth from 'mammoth'
// import pdf from 'pdf-parse'
// @ts-ignore
// const pdf = require('pdf-parse')

export async function POST(req: NextRequest) {
    try {
        const { filePath } = await req.json()

        if (!filePath) {
            return NextResponse.json({ error: 'File path required' }, { status: 400 })
        }

        const supabase = await createClient()

        // Download file from Supabase Storage
        const { data, error } = await supabase.storage
            .from('documents')
            .download(filePath)

        if (error || !data) {
            console.error('Download error:', error)
            return NextResponse.json({ error: 'Failed to download file' }, { status: 500 })
        }

        const arrayBuffer = await data.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        let text = ''

        const lowerPath = filePath.toLowerCase()

        if (lowerPath.endsWith('.docx')) {
            const result = await mammoth.extractRawText({ buffer })
            text = result.value
        } else if (lowerPath.endsWith('.pdf')) {
            // const pdfData = await pdf(buffer)
            // text = pdfData.text
            return NextResponse.json({ content: '', message: 'PDF parsing temporarily disabled.' })
        } else {
            return NextResponse.json({ content: '', message: 'Unsupported file type.' })
        }

        // Clean text (remove excessive newlines)
        const cleanText = text.replace(/\n\s*\n/g, '\n').trim()

        return NextResponse.json({ content: cleanText })

    } catch (error: any) {
        console.error('Conversion error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
