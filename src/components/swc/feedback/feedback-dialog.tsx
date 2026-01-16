'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea'; // Assuming exists or will use basic textarea
import { MessageSquarePlus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

export function FeedbackDialog() {
    const [open, setOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);

    const handleSubmit = async () => {
        if (!message.trim()) return;
        setIsSending(true);

        const supabase = createClient();
        const { error } = await supabase.from('audit_logs').insert({
            action: 'USER_FEEDBACK',
            details: { message },
        });

        setIsSending(false);

        if (error) {
            toast.error('送信に失敗しました');
        } else {
            toast.success('フィードバックを送信しました。ありがとうございます！');
            setMessage('');
            setOpen(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" className="w-full justify-start gap-2 text-gray-500 hover:text-gray-900">
                    <MessageSquarePlus className="h-4 w-4" />
                    フィードバック
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>フィードバック送信</DialogTitle>
                    <DialogDescription>
                        機能のご要望やバグ報告など、お気軽にお送りください。
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <textarea
                        className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="例: この機能が使いにくい、こんな機能が欲しい..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                    />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>キャンセル</Button>
                    <Button onClick={handleSubmit} disabled={isSending || !message.trim()}>
                        {isSending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        送信する
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
