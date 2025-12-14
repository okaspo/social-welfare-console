# AI Development Context (DO NOT DELETE)

## 1. System Overview
- **Project:** Social Welfare DX Console (GovAI)
- **Tech Stack:** Next.js 16 (App Router), Supabase, Tailwind/Shadcn, Vercel, AI SDK 4.0
- **Current Version:** v0.5.0 (Alpha)

## 2. Architecture Status
- **Prompt Stacking:** Implemented (Persona + Core + Plan Modules). Dynamic assembly in `app/api/chat/route.ts`.
- **Data Security:** Strict RLS enforcement.
    - Owners can only access their own `documents` and `organization_usage`.
    - `common_knowledge` and `plan_limits` are public read.
- **Pricing Engine:** Implemented.
    - **Limits:** Defined in `plan_limits` (JSONB features).
    - **Prices:** Defined in `plan_prices` (Supports Campaigns).
- **Admin Console:** Implemented (`/dashboard/admin`).
    - Dynamic Plan & Feature Editor (JSONB support).
    - Price management.

## 3. Database Schema Snapshot

### `plan_limits` (Configuration)
- **PK:** `plan_id` (text)
- **Cols:** `monthly_chat_limit`, `monthly_doc_gen_limit`, `storage_limit_mb`, `max_users`
- **Features:** `features` (JSONB) - Dynamic boolean/value flags (e.g. `can_download_word`).

### `plan_prices` (Pricing)
- **PK:** `id` (uuid)
- **FK:** `plan_id` -> `plan_limits`
- **Cols:** `amount`, `interval` ('month'/'year'), `is_public` (bool), `campaign_code` (text, nullable)

### `organizations` (Tenant)
- **Extends:** Supabase Auth tied (via `profiles` mapping usually, or direct).
- **Cols:** `org_type`, `jurisdiction_area`, `plan_id` (default 'free'), `current_price_id` (FK to `plan_prices`)

### `documents` (Data)
- **RLS:** `organization_id` check against authenticated user's org.
- **Pipeline:** Upload -> `converter.ts` (Mammoth/PDF-Parse) -> Markdown -> Vector/Text Storage.

## 4. Active Tasks (ToDo)
- [ ] **Stripe Integration**: Backend actions ready (`addPrice`), need Webhook handler & Checkout Session.
- [ ] **Frontend Polish**: Improve Billing Page UI, specific error messages for card failures.
- [ ] **Production Deployment**: Final verification on Vercel (Current Focus).
- [ ] **Testing**: E2E testing for critical flows (Signup -> Chat -> Upgrade).

## 5. Environment & Credentials
- **Supabase:** Connected. RLS Policies active.
- **Auth:** Supabase Auth (Email/Pass).
- **AI:** OpenAI (via Vercel AI SDK).
- **Hosting:** Vercel (Edge/Serverless logic optimized).
