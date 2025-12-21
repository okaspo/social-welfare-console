'use client';

import { useState } from 'react';
import { Download, FileSpreadsheet, FileJson, Loader2 } from 'lucide-react';

export default function AuditLogExport() {
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async (format: 'csv' | 'json') => {
        setIsExporting(true);
        try {
            const response = await fetch(`/api/admin/audit-logs/export?format=${format}`);
            if (!response.ok) throw new Error('Export failed');

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `audit_logs_${new Date().toISOString().split('T')[0]}.${format}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Export failed:', error);
            alert('エクスポートに失敗しました');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="flex items-center gap-2">
            <button
                onClick={() => handleExport('csv')}
                disabled={isExporting}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-md text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
                {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
                CSV
            </button>
            <button
                onClick={() => handleExport('json')}
                disabled={isExporting}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-md text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
                {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileJson className="h-4 w-4" />}
                JSON
            </button>
        </div>
    );
}
