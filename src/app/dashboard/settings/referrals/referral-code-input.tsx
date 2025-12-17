'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { enterReferralCode } from './actions';
import { toast } from 'sonner';
import { Search } from 'lucide-react';

export default function ReferralCodeInput() {
    const [code, setCode] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!code) return;

        setIsSubmitting(true);
        try {
            const result = await enterReferralCode(code);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success('紹介コードを適用しました！');
                setCode('');
                // Ideally refresh page or show success state
            }
        } catch (error) {
            toast.error('エラーが発生しました');
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mt-8">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Search className="h-5 w-5 text-gray-400" />
                紹介コードをお持ちの方はこちら
            </h3>
            <form onSubmit={handleSubmit} className="flex gap-4 items-end">
                <div className="flex-1 space-y-2">
                    <Label htmlFor="referral-code" className="sr-only">紹介コード</Label>
                    <Input
                        id="referral-code"
                        placeholder="例: REF-ABCD-1234"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        className="uppercase font-mono"
                    />
                </div>
                <Button type="submit" disabled={isSubmitting || !code} className="bg-gray-900 text-white">
                    適用する
                </Button>
            </form>
            <p className="text-xs text-gray-500 mt-2">
                ※ 有効なコードを入力すると、特典対象となります。
            </p>
        </div>
    );
}
