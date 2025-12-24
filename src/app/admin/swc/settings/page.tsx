import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Settings, Save } from 'lucide-react';

export default async function SwcSettingsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    // Fetch System Settings
    const { data: settings } = await supabase
        .from('system_settings')
        .select('*')
        .order('key');

    return (
        <div className="p-6">
            <div className="mb-8">
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                    <Settings className="h-4 w-4" />
                    <span>社会福祉法人コンソール</span>
                    <span>/</span>
                    <span>システム設定</span>
                </div>
                <h1 className="text-2xl font-bold text-gray-900">環境設定</h1>
                <p className="text-gray-600 mt-1">
                    システム全体の動作フラグやメンテナンスモードを管理します。
                </p>
            </div>

            <div className="bg-white rounded-xl border overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Key</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {settings?.map((setting: any) => (
                            <tr key={setting.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 font-mono">
                                    {setting.key}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono bg-gray-50">
                                    {setting.value}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">
                                    {setting.description}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button className="text-indigo-600 hover:text-indigo-900">Edit</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
