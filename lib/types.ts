export type OfficerRole = 'director' | 'auditor' | 'councilor';

export interface Officer {
    id: string;
    name: string;
    role: OfficerRole;
    term_start: string; // ISO date string YYYY-MM-DD
    term_end: string;   // ISO date string YYYY-MM-DD
    is_active: boolean;
    created_at: string;
    updated_at?: string;
    email?: string;
    phone?: string;
}

export type PlanType = 'free' | 'standard' | 'pro' | 'enterprise';

export interface PlanFeatures {
    can_download_word: boolean;
    can_use_custom_vectors: boolean;
    can_auto_generate_report: boolean;
    custom_support?: boolean;
    [key: string]: boolean | undefined;
}

export interface PlanLimit {
    plan_id: PlanType;
    monthly_chat_limit: number; // -1 for unlimited
    monthly_doc_gen_limit: number;
    storage_limit_mb: number;
    max_users: number;
    features: PlanFeatures;
    created_at: string;
}

export interface PlanPrice {
    id: string;
    plan_id: PlanType;
    amount: number;
    currency: string;
    interval: 'month' | 'year';
    is_public: boolean;
    campaign_code?: string;
    stripe_price_id?: string;
}

export interface OrganizationUsage {
    id: string;
    organization_id: string;
    current_month: string; // YYYY-MM-DD
    chat_count: number;
    doc_gen_count: number;
    storage_used_mb: number;
    updated_at: string;
}

export interface PromptModule {
    id: string;
    module_key: string;
    content: string;
    description?: string;
    created_at: string;
}

export interface Organization {
    id: string;
    name: string;
    plan_id: PlanType;
    org_type: string;
    jurisdiction_area?: string;
    created_at: string;
    // ... other existing fields if any
}
