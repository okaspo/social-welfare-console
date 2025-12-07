
import React from 'react';
import OfficerList from '@/components/officers/officer-list';
import { getOfficers } from '@/lib/officers/actions';

export default async function OfficersPage() {
    const officers = await getOfficers();

    return (
        <div className="container mx-auto py-8">
            <h1 className="text-3xl font-bold mb-6">役員・評議員管理</h1>
            <div className="bg-white shadow rounded-lg p-6">
                <OfficerList initialOfficers={officers} />
            </div>
        </div>
    );
}
