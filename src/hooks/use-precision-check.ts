// Precision Check Hook
// Handle precision check button click and display results

import { useState } from 'react';

export interface PrecisionCheckResult {
    verified: boolean;
    confidence: number;
    corrections: Array<{
        issue: string;
        correction: string;
    }>;
    explanation: string;
}

export function usePrecisionCheck() {
    const [isChecking, setIsChecking] = useState(false);
    const [result, setResult] = useState<PrecisionCheckResult | null>(null);

    const checkMessage = async (messageId: string, conversationHistory: any[]) => {
        setIsChecking(true);
        setResult(null);

        try {
            const response = await fetch('/api/swc/chat/precision-check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messageId, conversationHistory }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Precision check failed');
            }

            const data = await response.json();
            setResult(data.result);
            return data;

        } catch (error: any) {
            console.error('Precision check error:', error);
            throw error;
        } finally {
            setIsChecking(false);
        }
    };

    return { isChecking, result, checkMessage, setResult };
}
