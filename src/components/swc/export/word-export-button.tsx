// Word Export with Plan Gating
// Generate and download Word documents with Pro plan restriction

'use client';

import { useState } from 'react';
import { FileDown, Loader2 } from 'lucide-react';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';
import { PlanGate } from '@/components/swc/billing/plan-gate';
import { useCurrentPlan } from '@/hooks/use-current-plan';

interface WordExportButtonProps {
    title: string;
    content: string;
    metadata?: Record<string, string>;
}

export default function WordExportButton({
    title,
    content,
    metadata = {},
}: WordExportButtonProps) {
    const { plan, loading } = useCurrentPlan();
    const [exporting, setExporting] = useState(false);

    async function handleExport() {
        setExporting(true);

        try {
            // Create document
            const doc = new Document({
                sections: [
                    {
                        children: [
                            // Title
                            new Paragraph({
                                text: title,
                                heading: HeadingLevel.HEADING_1,
                            }),
                            // Metadata
                            ...Object.entries(metadata).map(
                                ([key, value]) =>
                                    new Paragraph({
                                        children: [
                                            new TextRun({ text: `${key}: `, bold: true }),
                                            new TextRun(value),
                                        ],
                                    })
                            ),
                            // Empty line
                            new Paragraph({ text: '' }),
                            // Content
                            ...content.split('\n').map(
                                (line) =>
                                    new Paragraph({
                                        text: line,
                                    })
                            ),
                        ],
                    },
                ],
            });

            // Generate and download
            const blob = await Packer.toBlob(doc);
            const fileName = `${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]
                }.docx`;
            saveAs(blob, fileName);

            // Log export
            await fetch('/api/usage/log', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    feature: 'word_export',
                    metadata: { fileName, title },
                }),
            });
        } catch (error) {
            console.error('Word export error:', error);
            alert('Word書き出しに失敗しました。');
        } finally {
            setExporting(false);
        }
    }

    if (loading) {
        return (
            <button
                disabled
                className="px-4 py-2 bg-gray-200 text-gray-400 rounded-lg cursor-not-allowed"
            >
                <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                読込中...
            </button>
        );
    }

    return (
        <PlanGate feature="Word書き出し" requiredPlan="pro" currentPlan={plan}>
            <button
                onClick={handleExport}
                disabled={exporting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
                {exporting ? (
                    <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        書き出し中...
                    </>
                ) : (
                    <>
                        <FileDown className="h-4 w-4" />
                        Word書き出し
                    </>
                )}
            </button>
        </PlanGate>
    );
}
