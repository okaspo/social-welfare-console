'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Loader2, MessageSquare, CheckCircle, Circle, AlertCircle } from 'lucide-react';

interface Feedback {
    id: string;
    category: string;
    content: string;
    status: 'pending' | 'reviewed' | 'resolved';
    admin_note: string | null;
    created_at: string;
    user: {
        email: string;
    } | null; // Join not trivial without view usually, but we can try referencing auth.users if possible or just show ID. 
    // Supabase JS client doesn't join auth.users automatically easily.
    // For now showing content/date.
}

export default function AdminFeedbacksPage() {
    const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        fetchFeedbacks();
    }, []);

    const fetchFeedbacks = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('user_feedback')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error(error);
        } else {
            setFeedbacks(data as any);
        }
        setLoading(false);
    };

    const updateStatus = async (id: string, status: string) => {
        const { error } = await supabase
            .from('user_feedback')
            .update({ status })
            .eq('id', id);

        if (!error) fetchFeedbacks();
    };

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="container mx-auto py-8 px-4">
            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <MessageSquare className="h-6 w-6" />
                ユーザーフィードバック
            </h1>

            <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Content</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {feedbacks.map((item) => (
                            <tr key={item.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {new Date(item.created_at).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                        ${item.category === 'bug' ? 'bg-red-100 text-red-800' :
                                            item.category === 'feature' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                                        {item.category}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-900 max-w-md truncate" title={item.content}>
                                    {item.content}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {item.status === 'pending' && <span className="flex items-center gap-1 text-yellow-600"><Circle className="h-3 w-3 fill-current" /> Pending</span>}
                                    {item.status === 'reviewed' && <span className="flex items-center gap-1 text-blue-600"><AlertCircle className="h-3 w-3" /> Reviewed</span>}
                                    {item.status === 'resolved' && <span className="flex items-center gap-1 text-green-600"><CheckCircle className="h-3 w-3" /> Resolved</span>}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <select
                                        value={item.status}
                                        onChange={(e) => updateStatus(item.id, e.target.value)}
                                        className="border rounded text-xs p-1"
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="reviewed">Reviewed</option>
                                        <option value="resolved">Resolved</option>
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
