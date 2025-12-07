
import React from 'react';
import MeetingForm from '@/components/meetings/meeting-form';

export default function MinutesPage() {
    return (
        <div className="container mx-auto py-8">
            <h1 className="text-3xl font-bold mb-6">理事会・評議員会 議事録作成</h1>
            <div className="bg-white shadow rounded-lg p-6">
                <MeetingForm />
            </div>
        </div>
    );
}
