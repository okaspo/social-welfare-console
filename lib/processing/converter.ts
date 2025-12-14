import mammoth from 'mammoth';
const pdf = require('pdf-parse');

export async function convertFileToMarkdown(buffer: Buffer, mimeType: string): Promise<string> {
    try {
        if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            // Convert Word to Markdown-like HTML then to text/markdown
            // Mammoth is good for getting clean HTML. We can convert standard tags to markdown.
            // Or just get raw text if layout is complex. Let's try raw text with some structure.

            // Actually mammoth can output raw text, or html.
            // Let's use raw text for simplicity for now as "Markdown" converter is complex without a library like Turndown.
            // BUT requirements asked for markdown syntax for headers. 
            // Mammoth map options:
            const options = {
                styleMap: [
                    "p[style-name='Heading 1'] => h1:fresh",
                    "p[style-name='Heading 2'] => h2:fresh",
                    "p[style-name='Heading 3'] => h3:fresh"
                ]
            };
            const result = await mammoth.convertToHtml({ buffer: buffer }, options);
            // Simple HTML to Markdown conversion (Mocking MarkItDown behavior)
            let md = result.value;
            md = md.replace(/<h1>(.*?)<\/h1>/g, '# $1\n\n');
            md = md.replace(/<h2>(.*?)<\/h2>/g, '## $1\n\n');
            md = md.replace(/<h3>(.*?)<\/h3>/g, '### $1\n\n');
            md = md.replace(/<p>(.*?)<\/p>/g, '$1\n\n');
            // Remove other tags
            md = md.replace(/<[^>]*>/g, '');
            return md.trim();

        } else if (mimeType === 'application/pdf') {
            const data = await pdf(buffer);
            return data.text.trim();
        } else {
            return '';
        }
    } catch (error) {
        console.error('Conversion failed:', error);
        return '';
    }
}
