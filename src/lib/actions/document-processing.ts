'use server'

import mammoth from 'mammoth'
// import pdf from 'pdf-parse'
// const pdf = require('pdf-parse')

export type ProcessResult = {
    success: boolean
    text?: string
    error?: string
}

export async function processUploadedFile(formData: FormData): Promise<ProcessResult> {
    const file = formData.get('file') as File
    if (!file) {
        return { success: false, error: 'No file uploaded' }
    }

    try {
        const buffer = Buffer.from(await file.arrayBuffer())
        let text = ''

        if (file.type === 'application/pdf') {
            // const pdfData = await pdf(buffer)
            // text = pdfData.text
            return { success: false, error: 'PDF parsing is currently disabled due to server compatibility.' }
        } else if (
            file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
            file.name.endsWith('.docx')
        ) {
            const result = await mammoth.extractRawText({ buffer })
            text = result.value
        } else {
            return { success: false, error: 'Unsupported file type. Please upload PDF or Word (.docx).' }
        }

        // Basic cleaning
        const cleanText = text.replace(/\n\s*\n/g, '\n').trim()

        return { success: true, text: cleanText }
    } catch (error) {
        console.error('File processing error:', error)
        return { success: false, error: 'Failed to process file' }
    }
}
