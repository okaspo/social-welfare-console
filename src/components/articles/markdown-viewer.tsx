
import React from 'react';
import ReactMarkdown from 'react-markdown';

interface MarkdownViewerProps {
    content: string;
}

export function MarkdownViewer({ content }: MarkdownViewerProps) {
    return (
        <article className="prose prose-sm md:prose-base lg:prose-lg max-w-none">
            <ReactMarkdown>{content}</ReactMarkdown>
        </article>
    );
}
