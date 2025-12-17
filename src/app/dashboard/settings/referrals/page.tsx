import { createClient } from '@/lib/supabase/server';
import { Gift, Share2, Copy, Users, Coins } from 'lucide-react';
import ReferralWidget from './referral-widget';
import ReferralCodeInput from './referral-code-input';
import { getReferralData, getReferralStats } from './actions';

export default async function ReferralPage() {
    const referral = await getReferralData();
    const stats = await getReferralStats();

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-4 mb-12">
                <div className="inline-flex items-center justify-center p-3 bg-orange-100 rounded-full mb-4">
                    <Gift className="h-8 w-8 text-orange-600" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900">お友達紹介プログラム</h1>
                <p className="text-gray-500 max-w-lg mx-auto">
                    あなたの紹介コードで、知り合いの法人様がGovAI Consoleを始めると、<br />
                    双方に<span className="font-bold text-orange-600">Amazonギフト券 1,000円分</span>をプレゼント！
                </p>
            </div>

            {/* Main Widget */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-orange-100">
                <div className="bg-gradient-to-r from-orange-500 to-red-500 p-1"></div>
                <div className="p-8">
                    <ReferralWidget
                        initialCode={referral?.referral_code}
                        initialStats={stats}
                    />
                </div>
            </div>

            {/* Input for invitee */}
            <ReferralCodeInput />

            {/* How it works */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
                <div className="text-center space-y-3">
                    <div className="mx-auto h-12 w-12 bg-gray-50 rounded-full flex items-center justify-center font-bold text-gray-400 text-xl border border-gray-200">1</div>
                    <h3 className="font-bold text-gray-900">リンクをシェア</h3>
                    <p className="text-sm text-gray-500">発行された専用URLを、SNSやメールで知り合いに送ります。</p>
                </div>
                <div className="text-center space-y-3">
                    <div className="mx-auto h-12 w-12 bg-gray-50 rounded-full flex items-center justify-center font-bold text-gray-400 text-xl border border-gray-200">2</div>
                    <h3 className="font-bold text-gray-900">登録完了</h3>
                    <p className="text-sm text-gray-500">紹介された方がGovAI Consoleに登録し、利用を開始します。</p>
                </div>
                <div className="text-center space-y-3">
                    <div className="mx-auto h-12 w-12 bg-gray-50 rounded-full flex items-center justify-center font-bold text-gray-400 text-xl border border-gray-200">3</div>
                    <h3 className="font-bold text-gray-900">特典GET</h3>
                    <p className="text-sm text-gray-500">翌月末に、登録メールアドレス宛にギフト券が届きます。</p>
                </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-xl text-xs text-gray-500 space-y-2 mt-8">
                <p className="font-bold">注意事項</p>
                <ul className="list-disc pl-4 space-y-1">
                    <li>ご自身による複数アカウント作成は対象外です。</li>
                    <li>紹介された方が過去に登録済みの場合、特典は付与されません。</li>
                    <li>不正利用と判断された場合、アカウント停止措置を行う場合があります。</li>
                </ul>
            </div>
        </div>
    );
}
