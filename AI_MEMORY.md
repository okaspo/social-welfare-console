# AI_MEMORY.md - System Knowledge Base

## Project Overview

**S級AI事務局 葵さん** - 社会福祉法人向けの法務DXプラットフォーム

社会福祉法人の理事長・事務長を支援する、法令遵守型のAIアシスタント。議事録作成、役員管理、定款・規程管理などの業務をサポート。

## Current Architecture

### Tech Stack
- **Frontend**: Next.js 15 (App Router), React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Server Actions
- **Database**: Supabase (PostgreSQL) with Row Level Security (RLS)
- **AI**: OpenAI GPT-4o-mini with custom prompt system
- **Deployment**: Vercel
- **Auth**: Supabase Auth

### Key Features (Implemented)
1. **AI Chat System** (葵さん)
   - Plan-based prompt layering (mod_persona + functional modules)
   - User context injection (role, age group, organization)
   - Knowledge base integration (common + private)

2. **Document Management**
   - Meeting minutes generation
   - Document wizard with AI assistance
   - Word export functionality

3. **Officer Management**
   - Term tracking and expiry alerts
   - Compliance with Social Welfare Act regulations

4. **User Profiling System** (NEW)
   - Role-based tone adaptation
   - Personalized addressing (「さん」付け)
   - Profile settings UI

5. **Multi-tier Pricing**
   - Free, Standard, Pro, Enterprise plans
   - Feature flags and usage quotas
   - Plan upgrade flow

## Active Tasks

**PRIORITY: Governance Automation System** (In Development)
- Magic link e-consent for board meetings
- Auto-minutes generation for written resolutions
- Database schema: ✅ Complete

## Future Roadmap (Q1 2026)

### 🔥 1. Governance Automation (HIGHEST PRIORITY)
**Status:** Database complete, backend/UI in progress  
**Plan Availability:** Standard, Pro & Enterprise

**Problem Solved:**
Automates legally-mandated convocation notices and consent collection for board meetings and written resolutions (みなし決議), reducing admin burden by 80%.

**Core Features:**
1. **Magic Link E-Consent**
   - One-click agreement via email (no login required)
   - Secure token-based authentication
   - Proof of receipt and consent with timestamps

2. **Auto-Minutes Generation**
   - Automatic draft creation when all officers consent
   - Includes individual consent timestamps for legal compliance
   - Template-based formatting per Social Welfare Act requirements

3. **Immutable Audit Trail**
   - Complete record of who consented when
   - IP address and user agent tracking
   - Tamper-proof logs for regulatory inspections

**Database Schema:**
- `meetings` table extensions:
  - `notification_sent_at`, `meeting_type`, `days_notice_required`
  - `auto_minutes_generated` flag
- `meeting_consents` table (NEW):
  - Token-based magic link system
  - Status tracking (pending/viewed/agreed/rejected)
  - Response metadata (IP, user agent, timestamp)
- `audit_logs` table: Logs all governance actions

**Workflow:**
1. Admin creates meeting (type: omission/physical/hybrid)
2. System generates unique magic link tokens for each officer
3. Emails sent with convocation notice + consent link
4. Officers click link → View proposal → Click "Agree"
5. System logs consent with timestamp and IP
6. When all agree → Auto-generate minutes draft
7. Admin reviews and finalizes minutes

**External Dependencies:**
- **Email Service:** Resend (recommended) or SendGrid
  - API Key required: `RESEND_API_KEY`
  - Estimated cost: $20/month for 50k emails
  - Japanese deliverability optimized

**Legal Compliance:**
- Satisfies Social Welfare Act written resolution requirements
- Complete audit trail for inspections
- Non-repudiation via IP/timestamp logging
- Bylaws-compliant notice periods enforced

**Implementation Status:**
- ✅ Database migration created (`20251215_governance_automation.sql`)
- ⏳ Server actions for consent management
- ⏳ Magic link consent page UI
- ⏳ Email templates
- ⏳ Admin dashboard integration

**Success Metrics:**
- 80% reduction in meeting prep time
- 100% audit trail coverage
- 90%+ officer adoption rate

---

### 🔥 2. Officer Registry & Status Reporting (HIGH PRIORITY)
**Status:** Database complete, UI complete, auto-generation pending  
**Plan Availability:** Standard, Pro & Enterprise

**Problem Solved:**
Automates creation of officer registry (役員名簿) and status reports (現況報告書) for regulatory submissions, eliminating manual data entry and format errors.

**Core Features:**
1. **Enhanced Officer Data Management**
   - Address, date of birth, occupation tracking
   - Remuneration status flagging
   - Age calculation and disqualification checks
   - Privacy-focused data masking in list views

2. **Auto-Generate Officer Registry (役員名簿)**
   - Excel/PDF export in official format
   - Japanese era conversion (Showa/Heisei/Reiwa)
   - Automatic field mapping from database
   - Template-based formatting per prefecture requirements

3. **Status Report Generation (現況報告書)**
   - Officer information section auto-fill
   - Remuneration summary calculations
   - Compliance verification

**Database Schema:**
- `officers` table extensions:
  - `address` (TEXT): Residential address for registry
  - `date_of_birth` (DATE): For age and disqualification checks
  - `occupation` (TEXT): For status reporting
  - `is_remunerated` (BOOLEAN): Compensation tracking
- Helper functions:
  - `calculate_age(birth_date)`: Current age calculation
  - `is_officer_qualified(birth_date, role)`: Disqualification checks
- Privacy view: `officers_masked` for list displays

**Japanese Era Conversion:**
```typescript
// Example: 1989-01-08 → "平成1年1月8日"
function toJapaneseEra(date: string): string {
  const eras = [
    { name: '令和', start: '2019-05-01' },
    { name: '平成', start: '1989-01-08' },
    { name: '昭和', start: '1926-12-25' }
  ];
  // Calculate era year and format
}
```

**Privacy & Security:**
- List view shows masked data (address: 〒***-****, dob: YYYY年MM月のみ)
- Full data visible only in detail/edit views
- RLS policies prevent cross-organization access
- Future: Audit logging for PII access

**Implementation Status:**
- ✅ Database migration created (`20251216_officer_personal_info.sql`)
- ✅ Officer interface extended with PII fields
- ✅ Officer form UI created with privacy warnings
- ⏳ Masked list view implementation
- ⏳ Excel/PDF export templates
- ⏳ Japanese era conversion utility
- ⏳ Auto-generation backend logic

**Export Formats:**
- **役員名簿 (Officer Registry):** Excel template → PDF
- **現況報告書 (Status Report):** Word template → PDF
- **CSV Export:** For backup/analysis

---

### 🔥 3. Governance Management & Audit Readiness (HIGH PRIORITY)
**Status:** Database complete, UI pending  
**Plan Availability:** Pro & Enterprise

**Problem Solved:**
Automates critical governance compliance checks for audits: conflict of interest detection (1/3 rule), concurrent posts tracking, and officer training documentation.

**Core Features:**
1. **Conflict of Interest Management**
   - Family relationship tracking (配偶者、親、子、兄弟姉妹、etc.)
   - Automatic 1/3 rule violation detection (Social Welfare Act Article 45-13)
   - Relationship matrix visualization
   - Real-time compliance alerts

2. **Concurrent Posts Tracking (兼職情報)**
   - Multi-organization role management
   - Compensation tracking (paid/unpaid)
   - Status report auto-generation
   - Historical post tracking

3. **Training Records Management (研修履歴)**
   - Training participation documentation
   - Annual hours calculation
   - PDF upload (future: OCR auto-fill)
   - Attendance status tracking

**Database Schema:**
- `officer_relationships` table:
  - Bidirectional relationship tracking
  - 9 relationship types (spouse, parent, child, sibling, etc.)
  - CHECK constraint prevents duplicate A-B/B-A entries
- `officer_concurrent_posts` table:
  - Current and historical posts
  - Compensation amount tracking
  - Organization type classification
- `officer_training_records` table:
  - Training date, title, organizer, duration
  - File upload support (report, certificate)
  - Attendance status enum
- Helper functions:
  - `check_relative_ratio_compliance(org_id)`: Auto-checks 1/3 rule
  - `get_officer_training_hours(officer_id, year)`: Annual training hours

**1/3 Rule Algorithm:**
```
Social Welfare Act Article 45-13:
Max 1/3 of directors may be related by blood/marriage within 3rd degree

Algorithm:
1. Count total active directors
2. Find all directors with relationships (graph algorithm)
3. Check: related_count <= floor(total / 3)
4. If violated → Display warning with details
```

**UI Components (Planned):**
- **Relationship Matrix** (`/dashboard/officers/relationships`):
  - Interactive grid showing all relationships
  - Click-to-add new relationships
  - Compliance alert banner
  - Export to PDF for audits

- **Training Log** (`/dashboard/officers/training`):
  - Filterable list (by officer, date range)
  - Training record input form
  - PDF upload placeholder (future OCR)
  - Annual hours dashboard

- **Concurrent Posts Tab**:
  - Dynamic sub-form in OfficerForm
  - Add/remove multiple posts
  - Paid/unpaid toggle
  - Organization type selection

**Implementation Status:**
- ✅ Database migration created (`20251216_governance_features.sql`)
- ✅ 1/3 rule compliance check function
- ✅ Training hours calculation function
- ⏳ Relationship matrix UI
- ⏳ Training log UI
- ⏳ Concurrent posts tab in OfficerForm
- ⏳ Export to PDF functionality

**Audit Compliance:**
- Conflict of interest: Article 45-13 automatic verification
- Status report: Concurrent posts section auto-generation
- Training compliance: Documentation ready for inspection
- Complete audit trail with timestamps

---

### 🚀 Future-Proofing: Multi-Entity Support Architecture
**Status:** Core architecture complete, entity expansion ready  
**Plan Availability:** All plans

**Problem Solved:**
Enables zero-code-rewrite expansion to NPO, medical corporations, and general incorporated associations. New entity types added via configuration only.

**Supported Entity Types:**
- ✅ **社会福祉法人** (Social Welfare Corporation) - Current
- 📋 **NPO法人** (NPO Corporation) - Ready for expansion
- 📋 **医療法人** (Medical Corporation) - Ready for expansion
- 📋 **一般社団法人** (General Incorporated Association) - Ready for expansion

**Core Architecture:**

1. **Entity Configuration System** (`src/lib/entity/config.ts`)
   - Single source of truth for all entity rules
   - Officer roles, term years, compliance rules per entity
   - Prompt module mappings
   - Extendable via configuration (no code changes)

2. **Entity-Aware Prompt Building**
   - Automatic law module loading based on entity_type
   - `mod_social_welfare_law` (current)
   - `mod_npo_law` (future)
   - `mod_medical_care_act` (future)
   - `mod_general_inc_act` (future)

3. **Terminology Mapping** (`src/lib/entity/terminology.ts`)
   - UI labels switch automatically
   - Examples:
     - Social Welfare: 所轄庁(都道府県・市), 評議員会
     - NPO: 所轄庁(都道府県・内閣府), 社員総会
     - Medical: 行政庁, 社員総会

4. **Entity-Aware Validation** (`src/lib/entity/validation.ts`)
   - Officer role validation per entity type
   - Mandatory officer checks
   - Compliance rule verification (e.g., 1/3 rule for social_welfare only)

**Database Schema:**
- `organizations.entity_type`: Enum column for entity classification
- `common_knowledge.target_entity_types[]`: Array for knowledge scoping
- Helper functions: `get_role_label()`, `get_role_term_years()`

**Adding New Entity Type (Future):**
```typescript
// 1. Add to EntityType enum
export type EntityType = 'social_welfare' | 'npo' | 'medical_corp' | 'general_inc' | 'new_entity';

// 2. Add configuration
ENTITY_CONFIGS.new_entity = {
  type: 'new_entity',
  name: '新法人種別',
  roles: { /* ... */ },
  promptModules: { lawModule: 'mod_new_law' },
  // ...
};

// 3. Create prompt module in database
// 4. Tag relevant knowledge
// Done! No other code changes needed.
```

**Implementation Status:**
- ✅ Database migration (`20251216_multi_entity_support.sql`)
- ✅ Entity configuration system
- ✅ Terminology mapping
- ✅ Validation utilities
- ✅ Prompt builder integration
- ⏳ UI entity selector
- ⏳ Future law modules (NPO, Medical, etc.)

**Extensibility Metrics:**
- New entity type added in < 1 hour
- Zero code changes required (config only)
- All features automatically compatible

---

### 4. Custom Domain Support
**Status:** Schema prepared, implementation pending  
**Plan Availability:** Pro & Enterprise only

**Features:**
- White-label portal for organizations (e.g., `portal.example.or.jp`)
- Vercel Domains API integration
- Automatic SSL certificate management
- Custom branding per organization

**Database:**
- `organizations.custom_domain` (text, unique, nullable)
- Middleware to detect custom domain and route appropriately

**Implementation Notes:**
- Requires Vercel Pro plan for custom domain API
- DNS configuration automation needed
- SSL cert provisioning via Vercel API

---

### 2. Email Notification System
**Status:** Schema prepared, implementation pending  
**Plan Availability:** All plans

**Features:**
- Board meeting reminders
- Officer term expiry alerts
- Document sharing notifications
- Customizable sender name per organization

**Database:**
- `organizations.email_sender_name` (text, default: 'S級AI事務局 葵さん')

**Integration Options:**
- Resend (recommended for Japanese market)
- SendGrid
- AWS SES

**Implementation Notes:**
- Email templates with i18n support
- Unsubscribe mechanism required
- Rate limiting per plan tier

---

### 3. Auditor Read-Only Role (監事)
**Status:** Planning phase  
**Plan Availability:** Pro & Enterprise

**Features:**
- Role-Based Access Control (RBAC) refinement
- "Kanji" (Auditor) role with read-only access
- Special permissions for audit logs viewing
- Compliance reporting dashboard

**Database Changes:**
- Extend `profiles.role` enum to include 'auditor'
- Create auditor-specific RLS policies

**Implementation Notes:**
- Auditors can view but not modify documents
- Special access to financial records
- Audit trail visibility

---

### 4. Security Audit Logs
**Status:** Schema ready, UI pending  
**Plan Availability:** Pro & Enterprise

**Features:**
- Comprehensive activity logging
- IP address and user agent tracking
- Immutable log entries (insert-only)
- Admin dashboard for log viewing/export
- CSV/JSON export functionality

**Database:**
- `audit_logs` table (implemented in 20251215_future_features_prep.sql)
  - organization_id, actor_id, action, target_resource
  - ip_address, user_agent, metadata (JSONB)
  - Immutable (no UPDATE/DELETE policies)

**Logged Actions:**
- download_document
- update_officer
- login/logout
- plan_change
- user_invite
- settings_change

**Implementation Notes:**
- Server-side logging with server actions
- Retention policy (1 year for Free, unlimited for Enterprise)
- Real-time monitoring alerts for suspicious activity

---

## Feature Flags (Added)

New flags in `plan_limits.features`:
- `can_use_custom_domain` (boolean) - Pro & Enterprise
- `can_send_email` (boolean) - All plans
- `can_view_audit_logs` (boolean) - Pro & Enterprise

## Database Schema Extensions (Completed)

Migration: `20251215_future_features_prep.sql`
- `organizations.custom_domain`
- `organizations.email_sender_name`
- `audit_logs` table with full RLS policies

Migration: `20251215_add_feature_flags.sql`
- Updated existing plans with new feature flags

Migration: `20251215_governance_automation.sql`
- Meetings table extensions for governance workflow
- `meeting_consents` table for magic link system
- Auto-trigger function for minutes generation

Migration: `20251216_officer_personal_info.sql`
- Officers table PII fields (address, date_of_birth, occupation, is_remunerated)
- `calculate_age()` and `is_officer_qualified()` helper functions
- `officers_masked` view for privacy-safe list displays

Migration: `20251216_governance_features.sql`
- `officer_relationships` table for conflict of interest tracking
- `officer_concurrent_posts` table for 兼職 management
- `officer_training_records` table for 研修履歴
- `check_relative_ratio_compliance()` function for 1/3 rule
- `get_officer_training_hours()` function for annual calculations

Migration: `20251216_multi_entity_support.sql`
- `organizations.entity_type` column (social_welfare, npo, medical_corp, general_inc)
- `common_knowledge.target_entity_types[]` array for knowledge scoping
- Relaxed `officers.role` constraint for multi-entity compatibility
- `get_role_label()` and `get_role_term_years()` helper functions

Migration: `20251216_admin_multi_entity.sql`
- `plan_limits.target_entity_type` for entity-specific plans
- `prompt_modules` composite unique key (slug, entity_type) for prompt variants
- `get_plans_for_entity()` helper function

Migration: `20251216_resilience_audit_persona.sql`
- `system_settings` table for maintenance mode and global flags
- `audit_criteria_master` table for dynamic compliance rules
- `assistant_profiles` table for multi-persona AI (Aoi, Aki, Ami)
- Seed data for three AI assistants with entity mapping

Migration: `20251216_editable_personas.sql`
- Updated `assistant_profiles` schema with code_name/display_name separation
- `code_name`: Immutable internal ID (used in file paths, logic)
- `display_name`: Editable user-facing name (changeable via admin UI)
- `catchphrase`: Customizable tagline
- Enables GUI-based persona renaming without code deployment

## Admin Console Features

**Multi-Entity Management:**
- Entity-specific plans (e.g., "Medical Corp Pro" separate from "Social Welfare Pro")
- Knowledge base entity tagging (universal vs entity-specific)
- Prompt module variants (same slug, different content per entity)
- User management entity filtering
- Entity badges and statistics throughout admin UI

**Components:**
- `EntityBadge`: Colored badges for visual entity identification
- Entity tabs/filters in admin pages
- Composite key support for entity-aware prompts

## System Resilience & Maintenance

**Maintenance Mode:**
- Admin-controlled system-wide toggle
- Redirects non-admin users to `/maintenance` page
- Preserves admin access during maintenance
- Custom maintenance messages via `system_settings`

**Backup & Recovery:**
- **Strategy:** Supabase Point-in-Time Recovery (PITR)
- **Frequency:** Continuous (automatic)
- **Retention:** 7 days
- **Recovery:** Any point in time within retention period
- **RTO (Recovery Time Objective):** < 2 hours

## Dynamic Audit Criteria Management

**Purpose:** GUI-managed compliance rules adaptable to regulatory changes

**Features:**
- Entity-specific audit criteria (social_welfare, medical_corp, npo, all)
- Category classification (Governance, Accounting, Labor)
- Severity levels (High, Medium, Low)
- Year-based applicability (법改正 support)
- Activation/deactivation without code deployment

**Database:** `audit_criteria_master` table with admin CRUD interface

## Multi-Persona AI Architecture (A-Series System)

**Three AI Assistants:**

1. **葵 (Aoi) - Social Welfare Specialist**
   - Target: 社会福祉法人
   - Personality: Formal, precise, perfectionist office professional
   - Theme Color: Blue (trust)
   - Tone: "丁寧で冷静、完璧主義"

2. **秋 (Aki) - NPO/General Inc. Partner**
   - Target: NPO法人 & 一般社団法人
   - Personality: Passionate, supportive partner
   - Theme Color: Orange (warmth, community)
   - Tone: "情熱的で応援型"

3. **亜美 (Ami) - Medical Consultant**
   - Target: 医療法人
   - Personality: Professional, concise, clean
   - Theme Color: Teal (medical, hygiene)
   - Tone: "知的で簡潔"

**Implementation:**
- `assistant_profiles` table with entity_type mapping
- Dynamic persona loading via `getAssistantProfile(entityType)`
- UI theming based on persona color
- Personality prompts per persona

Migration: `20251216_templates_memory.sql`
- `document_templates` table for plan-gated template library
- `conversation_memories` table for chat pinning/long-term memory
- Updated `plan_limits` with memory quotas (Free:0, Standard:50, Pro:200, Enterprise:1000)
- `get_user_memory_count()` helper function for quota checking
- 6 seed templates with plan-based access control

## Document Template System

**Purpose:** Pre-formatted documents with AI integration and plan-based access

**Features:**
- Template library with gallery view
- Categories: minutes, contracts, reports, forms, letters
- Plan-gated access (lock icon for restricted templates)
- "Use with AI" button for AI-assisted drafting
- Download functionality

**Seed Templates:**
- Board Minutes (Basic) - All plans
- Council Minutes - Standard+
- Board Minutes (Pro) - Pro+
- Status Report - Pro+
- Business Plan - Standard+
- Contract Template - Pro+

## Chat Memory & Pinning System

**Purpose:** Long-term conversation memory with plan-based quotas

**Features:**
- Pin button on each chat message
- Memory sidebar (desktop) / drawer (mobile)
- Plan quotas enforce limits
- RLS policies for user privacy

**Plan Quotas:**
- Free: 0 items (feature disabled)
- Standard: 50 items
- Pro: 200 items
- Enterprise: 1000 items

## Mobile & Tablet Optimization

**Strategy:** Mobile-first responsive design for elderly users (iPad/iPhone)

**Key Features:**
- Hamburger menu navigation (<768px)
- Touch targets minimum 44px (Apple HIG)
- No hover-only interactions
- Keyboard-safe input areas
- Safe area insets for notched devices

**Target Users:** Social welfare officers, elderly demographics

## Dark Mode Support

**Purpose:** User-specific theme preferences (light/dark/system)

**Implementation:**
- next-themes library for theme management
- Theme stored per user in `user_preferences` table
- Toggle component with 3 modes: Light, Dark, System
- Tailwind CSS dark mode classes (class strategy)
- suppressHydrationWarning on html tag

**Persistence:** Theme preference saved per user and persists across sessions

## Visual Feature Gating (PlanGate)

**Purpose:** Clear visual indication of locked features with upgrade prompts

**Component:** `src/components/common/plan-gate.tsx`

**Features:**
- Blur overlay on locked content
- Lock icon with plan badge
- Feature-specific descriptions
- Upgrade CTA button
- Plan hierarchy checking (free < standard < pro < enterprise)

**Locked Features:**
- Email Sending (Standard+)
- Word Export (Pro+)
- Long-term Memory (Standard+)
- Custom Domain (Enterprise)
- Audit Logs (Pro+)

**Usage:**
```tsx
<PlanGate featureKey="email_sending" minPlan="standard">
  <EmailSendButton />
</PlanGate>
```

```

## Legal Compliance

**Purpose:** Prevent unauthorized use of protected professional qualification terms

**Prohibited Terms:** 司法書士, 行政書士, 税理士, 弁護士

**Compliant Alternatives:**
- AI法務アドバイザー
- 事務局パートナー
- 会計知識ベース
- 法務専門知識を持つAI

**Validation:** `legal-validator.ts` for runtime text scrubbing

## Dynamic Avatar System

**Purpose:** Seasonal and emotional avatar variations for engagement

**Tables:** `assistant_avatars` with condition types (default, season, emotion, event)

**Selection Logic:**
1. Event (active period)
2. Emotion (happy, thinking, apology)
3. Season (spring, summer, autumn, winter)
4. Default fallback

**Implementation:** `avatar-selector.ts` with priority-based selection

## Engagement Content

**Daily Tweets:** `daily_tweets` table for assistant messages

**Break Room Menu:** 4-koma manga, goods shop (planned)

**Usage:** Dashboard widgets and sidebar content

## User Feedback System

**Purpose:** AI-powered feature request collection

**Tables:** `user_feedback` with categories (feature_request, bug, usability)

**Statuses:** new, reviewing, planned, implemented, declined

**Admin Interface:** `/admin/feedback` for review and management

## Future Roadmap

### Sales & Growth Features

**Referral System (紹介プログラム)**
- Purpose: Viral growth through user referrals
- Database: `referrals` table (referrer_id, referee_id, status, reward_claimed)
- UI: Dashboard widget with referral URL generator
- Rewards: Credit discount or free month for successful referrals
- Tracking: Conversion funnel analytics

**Guest Demo Mode (Sandbox)**
- Purpose: Try-before-buy experience
- Auth: Anonymous access to `/demo` route
- Limits: LocalStorage-based quota (3 chats, 1 document)
- Conversion: Registration modal at limit
- Data: Isolated demo dataset, no persistence

### High-Value Functionality

**Subsidy AI Matcher (助成金マッチング) - HIGH PRIORITY**
- Purpose: Recommend available subsidies based on user profile
- Monetization: Standard+ feature or optional add-on (¥5,000/month)
- Database Design:
  ```sql
  -- Subsidy master data
  CREATE TABLE subsidies (
    id UUID PRIMARY KEY,
    title TEXT NOT NULL,
    provider TEXT, -- 行政機関名
    category TEXT, -- 設備投資/人材育成/運営費
    target_entity_types TEXT[], -- ['social_welfare', 'npo']
    target_regions TEXT[], -- ['tokyo', 'osaka']
    target_business_types TEXT[], -- ['elderly_care', 'childcare']
    amount_min BIGINT,
    amount_max BIGINT,
    application_period_start DATE,
    application_period_end DATE,
    requirements JSONB,
    source_url TEXT,
    is_active BOOLEAN DEFAULT true
  );
  
  -- User subsidy matches
  CREATE TABLE organization_subsidies (
    id UUID PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id),
    subsidy_id UUID REFERENCES subsidies(id),
    match_score DECIMAL, -- AI confidence score
    status TEXT, -- 'matched', 'applied', 'granted', 'rejected'
    applied_at TIMESTAMPTZ,
    notes TEXT
  );
  ```
- Data Source: Web scraping (政府公開情報) or API integration
- AI Logic: Entity type + region + business scope matching
- UI: Recommendation dashboard with application tracking

**Calendar Integration**
- Purpose: Sync important dates to external calendars
- Export: iCal (.ics) format for meetings and officer terms
- API: Google Calendar API, Outlook API
- Events: Board meetings, council meetings, term expirations
- Reminders: Configurable notification timing

**E-Signature Integration (Future)**
- Purpose: Digital signing workflow for generated documents
- Target: CloudSign, DocuSign, Adobe Sign
- Workflow: Generate PDF → Send for signature → Archive signed copy
- Use Cases: Meeting minutes approval, contract signing
- Plan Gating: Enterprise feature

### Technical Enhancements

**Multi-language Support (国際化)**
- i18n framework (next-intl)
- Languages: Japanese (primary), English, Chinese
- Dynamic: UI labels, AI responses, document templates

**API Access (Developer Plan)**
- RESTful API for external integrations
- Endpoints: Organizations, Officers, Meetings, Documents
- Auth: API key management
- Rate limiting by plan

**White-label (Enterprise)**
- Custom domain
- Logo replacement
- Color scheme customization
- Remove "Powered by" branding

## Stripe Payment Integration

**Purpose:** Subscription billing for SaaS revenue

**Database:** `organizations` table extended with Stripe fields
- `stripe_customer_id`: Unique customer identifier
- `stripe_subscription_id`: Active subscription
- `subscription_status`: active, past_due, canceled, incomplete, trialing
- `current_period_end`: Renewal date
- `payment_method`: card or bank_transfer

**Payment Methods:**
- Credit Card (Visa, Mastercard, Amex, JCB)
- Bank Transfer (jp_bank_transfer for Japanese customers)
- Future: Konbini (コンビニ決済)

**Flows:**
1. Checkout: `/api/billing/checkout` creates Stripe session
2. Portal: `/api/billing/portal` for self-service management
3. Webhooks: `/api/webhooks/stripe` syncs subscription status

**Plan Mapping:** `src/config/billing.ts`
- Standard: ¥9,800/月、¥98,000/年
- Pro: ¥29,800/月、¥298,000/年

**Implementation:** Migration `20251216_stripe_integration.sql`

## API Cost Control

**Purpose:** Keep API costs under 15% of revenue through usage tracking and model routing

**Database:** `usage_logs` table for cost tracking, `plan_limits` extended with budgets

**Cost Limits by Plan:**
- Free: $0 (no AI access)
- Standard: $10/month budget → gpt-4o-mini only
- Pro: Fair use policy → gpt-4o + gpt-4o-mini (smart routing)
- Enterprise: Unlimited

**Model Pricing:**
- gpt-4o: $2.50/$10.00 per 1M input/output tokens
- gpt-4o-mini: $0.15/$0.60 per 1M tokens (16x cheaper)
- text-embedding-3-small: $0.02 per 1M tokens

**Model Router:** `src/lib/ai/model-router.ts`
- Assesses task complexity (simple/moderate/complex)
- Standard plan: Always mini
- Pro plan: Mini for simple, gpt-4o for complex

**Usage Limiter:** Circuit breaker pattern with `UsageLimitError`

**Implementation:** Migration `20251216_api_cost_control.sql`

## Zero-Hallucination Model Router

**Purpose:** Eliminate AI hallucinations through strict feature-based model assignment

**3-Tier Architecture:**

**Tier 3 - REASONING (o1/o3):** High-stakes legal checks
- Features: governance_check, subsidy_eligibility, article_validation, conflict_of_interest
- Models: o1-preview, o1-mini, o3-mini
- RAG: Required
- Creativity: Forbidden

**Tier 2 - COMMUNICATION (gpt-4o):** User interaction
- Features: chat_response, drafting_emails, drafting_minutes, explain_legal_result
- Models: gpt-4o (downgrade to mini for Standard plan)
- RAG: Required
- Creativity: Natural language only

**Tier 3 - PROCESSING (gpt-4o-mini):** Data processing
- Features: pdf_ocr, summarize_daily_report, tagging, extract_entities
- Models: gpt-4o-mini
- RAG: Not required
- Creativity: Forbidden

**Supervisor Pattern:** 2-phase legal checks
1. Phase 1: o1 reasoning (JSON output, citations required)
2. Phase 2: gpt-4o translation (user-friendly explanation)

**Implementation:** `src/lib/ai/model-config.ts`, `src/lib/ai/supervisor.ts`

## External Dependencies

### Email Service (Required for Governance Automation)
- **Service:** Resend (https://resend.com) - Recommended
- **Purpose:** Convocation notices, consent requests, notifications
- **Setup:** Add `RESEND_API_KEY` to environment variables
- **Cost:** ~$20/month for 50,000 emails/month
- **Alternatives:** SendGrid, AWS SES

### Domain Management (Optional)
- **Service:** Vercel Domains API
- **Purpose:** Custom domain white-labeling
- **Required Plan:** Vercel Pro ($20/month)

## Known Issues

None currently. System is stable.

## Deployment Notes

**Latest Deployment:** 2025-12-15
- User profiling system live
- Database ready for future features
- Feature flags configured

**Next Deployment Checklist:**
1. Apply new migrations to production Supabase
2. Update prompt modules via admin console
3. Test custom domain setup on staging
4. Configure email service credentials

---

*Last Updated: 2025-12-15*
