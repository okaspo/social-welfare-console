import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ChatSplitLayout from '@/components/layout/chat-split-layout';
import FullPageChat from '@/components/chat/full-page-chat';
import { getPersonaByEntityType } from '@/lib/ai/personas';

export default async function ChatPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Get user profile and organization
    const { data: profile } = await supabase
        .from('profiles')
        .select(`
            full_name,
            corporation_name,
            organization_id,
            organizations (
                id,
                entity_type,
                plan
            )
        `)
        .eq('id', user.id)
        .single();

    // Determine persona based on entity type
    const orgData = profile?.organizations;
    // @ts-ignore
    const entityType = (Array.isArray(orgData) ? orgData[0]?.entity_type : orgData?.entity_type) || 'social_welfare';
    const persona = getPersonaByEntityType(entityType);

    return (
        <ChatSplitLayout
            personaEmoji={persona.info.emoji}
            personaName={persona.info.name}
            userName={profile?.full_name || undefined}
            corporationName={profile?.corporation_name || undefined}
        >
            <FullPageChat
                personaId={persona.info.id}
                personaName={persona.info.name}
                personaEmoji={persona.info.emoji}
            />
        </ChatSplitLayout>
    );
}
