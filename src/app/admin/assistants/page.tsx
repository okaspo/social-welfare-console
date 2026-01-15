import { Metadata } from 'next';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { ProfileEditorList } from './components/profile-editor-list';

export const metadata: Metadata = {
    title: 'アシスタント管理 | GovAI Console',
    description: 'AIアシスタントのプロフィール編集'
};

export default async function AssistantsPage() {
    const supabase = await createAdminClient();

    // Check admin access
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        redirect('/login');
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'admin') {
        redirect('/swc/dashboard');
    }

    // Fetch all assistant profiles
    const { data: assistants, error } = await supabase
        .from('assistant_profiles')
        .select('*')
        .order('entity_type');

    if (error) {
        console.error('Error fetching assistants:', error);
        return <div>Error loading assistants</div>;
    }

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    アシスタント管理
                </h1>
                <p className="text-gray-600">
                    AIアシスタント（葵/秋/亜美）のプロフィールを編集できます
                </p>
            </div>

            <ProfileEditorList assistants={assistants || []} />
        </div>
    );
}
