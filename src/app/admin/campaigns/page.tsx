import { Metadata } from 'next';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { CampaignList } from './components/campaign-list';

export const metadata: Metadata = {
    title: 'キャンペーン管理 | GovAI Console',
    description: 'プロモーションコードの管理'
};

export default async function CampaignsPage() {
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
        redirect('/dashboard');
    }

    // Fetch campaigns
    // We join plan_prices to get the actual amount if linked, 
    // but for now let's just fetch the codes metadata
    const { data: campaigns, error } = await supabase
        .from('campaign_codes')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching campaigns:', error);
        return <div>Error loading campaigns</div>;
    }

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    キャンペーン管理
                </h1>
                <p className="text-gray-600">
                    プロモーションコードの作成と管理ができます
                </p>
            </div>

            <CampaignList initialCampaigns={campaigns || []} />
        </div>
    );
}
