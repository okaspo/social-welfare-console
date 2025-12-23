'use client';

import { useState } from 'react';
import { addRelationship, removeRelationship } from './actions';
import { Plus, X, UserMinus, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

type Officer = {
    id: string;
    name: string;
    role: string;
};

type Relationship = {
    id: string;
    officer_id_a: string;
    officer_id_b: string;
    relationship_type: string;
};

export default function RelationshipMatrix({
    officers,
    relationships
}: {
    officers: Officer[],
    relationships: Relationship[]
}) {
    const [loading, setLoading] = useState(false);

    // Helper to find relationship between two officers
    const findRelation = (id1: string, id2: string) => {
        const [a, b] = [id1, id2].sort();
        return relationships.find(r => r.officer_id_a === a && r.officer_id_b === b);
    };

    const handleAdd = async (id1: string, id2: string) => {
        if (loading) return;
        setLoading(true);
        try {
            // Simplified: adding 'relative_3rd_degree' as default for UI simplicity
            // In a full app, a modal would ask for specific type
            await addRelationship(id1, id2, 'relative_3rd_degree');
            toast.success('関係を追加しました');
        } catch (e) {
            toast.error('追加に失敗しました');
        } finally {
            setLoading(false);
        }
    };

    const handleRemove = async (relId: string) => {
        if (!confirm('この関係情報を削除しますか？')) return;
        if (loading) return;
        setLoading(true);
        try {
            await removeRelationship(relId);
            toast.success('関係を削除しました');
        } catch (e) {
            toast.error('削除に失敗しました');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="overflow-x-auto">
            {/* Matrix Header */}
            <div className="flex">
                <div className="w-32 flex-shrink-0"></div> {/* Corner spacer */}
                {officers.map(officer => (
                    <div key={officer.id} className="w-32 flex-shrink-0 p-2 text-center text-xs font-bold text-gray-700 writing-mode-vertical" style={{ writingMode: 'vertical-rl' }}>
                        {officer.name}
                    </div>
                ))}
            </div>

            {/* Matrix Body */}
            {officers.map((rowOfficer, rowIndex) => (
                <div key={rowOfficer.id} className="flex items-center border-t border-gray-100">
                    {/* Row Header */}
                    <div className="w-32 flex-shrink-0 p-2 text-xs font-medium text-gray-900 bg-gray-50/50">
                        {rowOfficer.name}
                        <span className="block text-[10px] text-gray-400">{rowOfficer.role}</span>
                    </div>

                    {/* Matrix Cells */}
                    {officers.map((colOfficer, colIndex) => {
                        // Diagonal (Same person)
                        if (rowOfficer.id === colOfficer.id) {
                            return <div key={colOfficer.id} className="w-32 h-16 bg-gray-100 border-l border-gray-100"></div>;
                        }

                        // Upper triangle only to avoid duplication visuals, or render both?
                        // Rendering full matrix for clarity, but actions only needed once per pair.
                        // However, simpler to just show interactive cells everywhere for UX.

                        const relation = findRelation(rowOfficer.id, colOfficer.id);

                        return (
                            <div key={colOfficer.id} className="w-32 h-16 flex items-center justify-center border-l border-gray-100 hover:bg-gray-50 transition-colors">
                                {relation ? (
                                    <button
                                        onClick={() => handleRemove(relation.id)}
                                        className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded hover:bg-red-100 hover:text-red-600 transition-colors w-full mx-2 truncate"
                                        title="クリックして関係を削除"
                                    >
                                        親族
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => handleAdd(rowOfficer.id, colOfficer.id)}
                                        className="h-6 w-6 rounded-full flex items-center justify-center text-gray-300 hover:bg-gray-200 hover:text-gray-600 transition-colors"
                                        title="関係を追加"
                                    >
                                        <Plus className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            ))}
        </div>
    );
}
