
import React from 'react';
import AttendanceSheet from '@/components/attendance/attendance-sheet';

export default function AttendancePage() {
    return (
        <div className="container mx-auto py-8">
            <h1 className="text-3xl font-bold mb-6">出席簿・定足数確認</h1>
            <div className="bg-white shadow rounded-lg p-6">
                <div className="mb-6 pb-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800">第1回 定時理事会</h2>
                    <p className="text-gray-500">2025年6月25日 14:00〜</p>
                </div>
                <AttendanceSheet />
            </div>
        </div>
    );
}
