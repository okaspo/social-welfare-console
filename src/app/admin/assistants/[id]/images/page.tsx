import { createAdminClient } from '@/lib/supabase/admin';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import AvatarManager from './avatar-manager';

export default async function Page({ params }: { params: { id: string } }) {
    const supabase = await createAdminClient();

    // Verify Admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    // Fetch Assistant
    const { data: assistant } = await supabase
        .from('assistant_profiles')
        .select('*')
        .eq('id', params.id)
        .single();

    if (!assistant) {
        return notFound();
    }

    // Map entity_type to simple code for avatar table
    const getAssistantCode = (entityType: string) => {
        if (entityType === 'social_welfare') return 'aoi';
        if (entityType === 'npo') return 'aki';
        if (entityType === 'medical_corp') return 'ami';
        return 'aoi'; // fallback
    };

    const assistantCode = getAssistantCode(assistant.entity_type);

    return (
        <div className="container mx-auto py-8 px-4 max-w-5xl">
            <Link href="/admin/assistants" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 transition">
                <ArrowLeft className="h-4 w-4" />
                一覧に戻る
            </Link>

            <AvatarManager
                assistantId={assistant.id}
                assistantCode={assistantCode}
                assistantName={assistant.name}
            />
        </div>
    );
}
