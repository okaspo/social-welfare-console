import { createClient } from '@/lib/supabase/server';
import { GraduationCap, Calendar, Clock, Plus, Check, X, MinusCircle } from 'lucide-react';

export default async function TrainingLogPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return <div>Unauthorized</div>;

    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

    if (!profile?.organization_id) return <div>組織情報が見つかりません</div>;

    // Fetch Training Records
    const { data: trainingRecords } = await supabase
        .from('officer_training_records')
        .select(`
            *,
            officer:officers(id, name, role)
        `)
        .eq('organization_id', profile.organization_id)
        .order('training_date', { ascending: false });

    // Fetch Officers for summary
    const { data: officers } = await supabase
        .from('officers')
        .select('id, name, role')
        .eq('organization_id', profile.organization_id)
        .eq('is_active', true);

    // Calculate training hours per officer
    const currentYear = new Date().getFullYear();
    const trainingHours: Record<string, number> = {};
    trainingRecords?.forEach(record => {
        const year = new Date(record.training_date).getFullYear();
        if (year === currentYear && record.attendance_status === 'attended') {
            trainingHours[record.officer_id] = (trainingHours[record.officer_id] || 0) + (record.duration_minutes / 60);
        }
    });

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'attended': return <Check className="h-4 w-4 text-green-600" />;
            case 'absent': return <X className="h-4 w-4 text-red-600" />;
            case 'excused': return <MinusCircle className="h-4 w-4 text-yellow-600" />;
            default: return null;
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'attended': return '出席';
            case 'absent': return '欠席';
            case 'excused': return '欠席（届出済）';
            default: return status;
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <GraduationCap className="h-6 w-6 text-indigo-600" />
                        研修履歴管理
                    </h1>
                    <p className="text-gray-500 mt-1">
                        役員の研修受講状況と年間受講時間を管理します。
                    </p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors">
                    <Plus className="h-4 w-4" />
                    研修を追加
                </button>
            </div>

            {/* Annual Training Summary */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-gray-600" />
                    {currentYear}年 研修受講サマリー
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {officers?.map(officer => (
                        <div key={officer.id} className="p-4 bg-gray-50 rounded-lg">
                            <div className="text-sm font-medium text-gray-900">{officer.name}</div>
                            <div className="text-xs text-gray-500">{officer.role === 'director' ? '理事' : officer.role === 'auditor' ? '監事' : officer.role}</div>
                            <div className="mt-2 flex items-center gap-1">
                                <Clock className="h-4 w-4 text-indigo-600" />
                                <span className="text-lg font-bold text-indigo-600">
                                    {(trainingHours[officer.id] || 0).toFixed(1)}
                                </span>
                                <span className="text-xs text-gray-500">時間</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Training Records List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900">研修履歴一覧</h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-3 text-left font-medium text-gray-600">日付</th>
                                <th className="px-6 py-3 text-left font-medium text-gray-600">研修名</th>
                                <th className="px-6 py-3 text-left font-medium text-gray-600">主催者</th>
                                <th className="px-6 py-3 text-left font-medium text-gray-600">受講者</th>
                                <th className="px-6 py-3 text-left font-medium text-gray-600">時間</th>
                                <th className="px-6 py-3 text-left font-medium text-gray-600">出欠</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {trainingRecords?.map(record => (
                                <tr key={record.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 text-gray-900">{record.training_date}</td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900">{record.title}</div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">{record.organizer}</td>
                                    <td className="px-6 py-4 text-gray-900">{record.officer?.name}</td>
                                    <td className="px-6 py-4 text-gray-600">{(record.duration_minutes / 60).toFixed(1)}h</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1">
                                            {getStatusIcon(record.attendance_status)}
                                            <span className={
                                                record.attendance_status === 'attended' ? 'text-green-700' :
                                                    record.attendance_status === 'absent' ? 'text-red-700' : 'text-yellow-700'
                                            }>
                                                {getStatusLabel(record.attendance_status)}
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {(!trainingRecords || trainingRecords.length === 0) && (
                        <div className="p-12 text-center text-gray-500">
                            研修履歴がまだありません。「研修を追加」から登録してください。
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
