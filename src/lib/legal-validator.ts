// Legal Compliance Text Validator
// Prevents usage of protected professional qualification terms

const PROHIBITED_TERMS = [
    '司法書士',
    '行政書士',
    '税理士',
    '弁護士'
] as const;

const COMPLIANT_ALTERNATIVES: Record<string, string> = {
    '司法書士': 'AI法務アドバイザー',
    '行政書士': '事務局パートナー',
    '税理士': '会計知識ベース',
    '弁護士': '法務専門知識を持つAI'
};

/**
 * Scrub prohibited legal qualification terms from text
 */
export function scrubLegalTerms(text: string): string {
    let cleaned = text;

    PROHIBITED_TERMS.forEach(term => {
        const replacement = COMPLIANT_ALTERNATIVES[term] || 'AI法務アドバイザー';
        cleaned = cleaned.replace(new RegExp(term, 'g'), replacement);
    });

    return cleaned;
}

/**
 * Validate text does not contain prohibited terms
 */
export function validateLegalCompliance(text: string): {
    isValid: boolean;
    violations: string[];
} {
    const violations: string[] = [];

    PROHIBITED_TERMS.forEach(term => {
        if (text.includes(term)) {
            violations.push(term);
        }
    });

    return {
        isValid: violations.length === 0,
        violations
    };
}

/**
 * Get compliant alternative for a term
 */
export function getCompliantAlternative(term: string): string {
    return COMPLIANT_ALTERNATIVES[term] || term;
}
