'use client';

import { useState } from 'react';
import { FileSpreadsheet, Loader2, ChevronDown, FileText, FileDown } from 'lucide-react';
import { exportOfficerRegistryCSV } from '@/lib/actions/officer-registry';
import { generateOfficerRegistryExcel } from '@/lib/actions/officer-excel-export';

export default function OfficerExportButton() {
    const [isExporting, setIsExporting] = useState(false);
    const [exportType, setExportType] = useState<'csv' | 'excel' | null>(null);
    const [showMenu, setShowMenu] = useState(false);

    const handleExportCSV = async () => {
        setExportType('csv');
        setIsExporting(true);
        setShowMenu(false);
        try {
            const csvContent = await exportOfficerRegistryCSV();
            if (!csvContent) {
                alert('データの取得に失敗しました');
                return;
            }

            const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `役員名簿_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Export failed:', error);
            alert('エクスポートに失敗しました');
        } finally {
            setIsExporting(false);
            setExportType(null);
        }
    };

    const handleExportExcel = async () => {
        setExportType('excel');
        setIsExporting(true);
        setShowMenu(false);
        try {
            const result = await generateOfficerRegistryExcel();
            if (!result.success || !result.data) {
                alert(result.error || 'Excelファイルの生成に失敗しました');
                return;
            }

            // Convert base64 to blob and download
            const byteCharacters = atob(result.data);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });

            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = result.filename || '役員名簿.xlsx';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Excel export failed:', error);
            alert('Excelエクスポートに失敗しました');
        } finally {
            setIsExporting(false);
            setExportType(null);
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => setShowMenu(!showMenu)}
                disabled={isExporting}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-md text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
                {isExporting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <FileDown className="h-4 w-4" />
                )}
                役員名簿を出力
                <ChevronDown className="h-3 w-3" />
            </button>

            {showMenu && !isExporting && (
                <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                    <button
                        onClick={handleExportExcel}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        <FileSpreadsheet className="h-4 w-4 text-green-600" />
                        Excel形式 (.xlsx)
                    </button>
                    <button
                        onClick={handleExportCSV}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        <FileText className="h-4 w-4 text-blue-600" />
                        CSV形式 (.csv)
                    </button>
                </div>
            )}
        </div>
    );
}
