'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useChat } from '@ai-sdk/react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Paperclip, Send, AlertCircle, Loader2 } from 'lucide-react';
import { uploadAndProcessDocument } from '@/app/actions/documents';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export function AoiChat() {
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Manual Input State to avoid type error with useChat
    const [input, setInput] = useState('');

    const chat = useChat({
        api: '/api/chat',
        onError: (err: Error) => {
            console.error('Chat error:', err);
        },
    });

    const { messages, append, isLoading, error } = chat as any;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInput(e.target.value);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;
        await append({ role: 'user', content: input });
        setInput('');
    };

    const onDrop = async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (!file) return;

        setIsUploading(true);
        setUploadError(null);
        setUploadSuccess(null);

        try {
            const formData = new FormData();
            formData.append('file', file);
            const result = await uploadAndProcessDocument(formData);

            setUploadSuccess(`Successfully read "${result.fileName}". Aoi has learned from it.`);
        } catch (e: any) {
            console.error(e);
            let msg = 'Upload failed.';
            if (e.message.includes('Storage limit reached')) {
                msg = 'Plans limit reached (Storage). Please upgrade.';
            } else if (e.message.includes('Quota')) {
                msg = 'Quota exceeded.';
            }
            setUploadError(msg);
        } finally {
            setIsUploading(false);
        }
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, maxFiles: 1 });

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Parse error to check for 403/Quota
    const isQuotaError = error?.message?.includes('QUOTA_EXCEEDED') || error?.message?.includes('limit reached') || error?.message?.includes('403');

    return (
        <Card className="flex flex-col h-[600px] w-full max-w-4xl mx-auto shadow-lg border-primary/20 bg-white/50 backdrop-blur-sm">
            <CardHeader className="bg-pink-50/50 border-b border-pink-100 py-3 flex flex-row items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-pink-200 flex items-center justify-center text-pink-700 font-bold border-2 border-white shadow-sm">
                    葵
                </div>
                <div>
                    <CardTitle className="text-lg text-slate-800">GovAI Aoi</CardTitle>
                    <p className="text-xs text-slate-500">Social Welfare Support Assistant</p>
                </div>
            </CardHeader>

            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30">
                {messages.length === 0 && (
                    <div className="text-center text-slate-400 mt-20 text-sm">
                        <p>Hello! I am Aoi.</p>
                        <p>Ask me anything about Social Welfare Corporations.</p>
                    </div>
                )}

                {messages.map((m: any) => (
                    <div key={m.id} className={cn("flex w-full", m.role === 'user' ? "justify-end" : "justify-start")}>
                        <div className={cn(
                            "max-w-[80%] rounded-lg px-4 py-2 text-sm shadow-sm",
                            m.role === 'user'
                                ? "bg-blue-600 text-white rounded-br-none"
                                : "bg-white border border-pink-100 text-slate-800 rounded-bl-none"
                        )}>
                            {m.content}
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="flex w-full justify-start">
                        <div className="bg-white border border-pink-100 text-slate-800 rounded-lg rounded-bl-none px-4 py-2 text-sm shadow-sm flex items-center gap-2">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-pink-500"></span>
                            </span>
                            <span className="text-xs text-slate-400">Aoi is typing...</span>
                        </div>
                    </div>
                )}

                {isQuotaError && (
                    <div className="mx-auto max-w-md bg-red-50 border border-red-200 rounded-md p-4 text-center">
                        <div className="flex justify-center text-red-500 mb-2"><AlertCircle /></div>
                        <h4 className="font-semibold text-red-700">Monthly Limit Reached</h4>
                        <p className="text-sm text-red-600 mb-3">
                            You have reached your plan's chat limit. Please upgrade to continue consulting with Aoi.
                        </p>
                        <Link href="/dashboard/settings/billing">
                            <Button variant="outline" className="border-red-200 text-red-700 hover:bg-red-100">
                                View Plans
                            </Button>
                        </Link>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </CardContent>

            <CardFooter className="bg-white border-t p-3">
                <form onSubmit={handleSubmit} className="flex w-full flex-col gap-2">
                    {/* Upload Area & Input */}
                    <div className="flex gap-2 items-end">
                        <div {...getRootProps()} className={cn(
                            "p-2 rounded-md border border-dashed cursor-pointer transition-colors",
                            isDragActive ? "bg-blue-50 border-blue-300" : "border-slate-300 hover:bg-slate-50",
                            uploadError ? "border-red-300 bg-red-50" : ""
                        )}>
                            <input {...getInputProps()} />
                            {isUploading ? <Loader2 className="animate-spin text-slate-400 h-5 w-5" /> : <Paperclip className="text-slate-400 h-5 w-5" />}
                        </div>

                        <Input
                            value={input}
                            onChange={handleInputChange}
                            placeholder="Type your question..."
                            className="flex-1"
                            disabled={!!isQuotaError}
                        />

                        <Button type="submit" disabled={isLoading || !input || !!isQuotaError} className="bg-pink-600 hover:bg-pink-700 text-white">
                            {isLoading ? <Loader2 className="animate-spin h-4 w-4" /> : <Send className="h-4 w-4 mr-1" />}
                            Consult Aoi
                        </Button>
                    </div>
                    {/* Upload Error Message */}
                    {uploadError && <p className="text-xs text-red-500">{uploadError}</p>}
                    {/* Upload Success Message */}
                    {uploadSuccess && <p className="text-xs text-green-600 font-medium">{uploadSuccess}</p>}
                    {/* Drag hint */}
                    <p className="text-[10px] text-slate-400 pl-1">
                        {isDragActive ? "Drop file here..." : "Drag & drop reference files (PDF, Word) here."}
                    </p>
                </form>
            </CardFooter>
        </Card>
    );
}
