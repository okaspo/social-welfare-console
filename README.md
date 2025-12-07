# GovAI Social Welfare Console (社会福祉法人運営コンソール)

A comprehensive dashboard for managing Social Welfare Corporations (社会福祉法人), integrated with AI Judicial Scrivener capabilities and Supabase-backed data persistence.

## Features

- **Documents & Minutes**: Generate legal meeting minutes (Board of Directors, Councilors) with one click. 
    - *Plan Exclusive*: Export to Word (.docx) for Standard/Pro users.
- **Officer Management**: Track terms (Directors: 2 years, Councilors: 4 years) with automatic expiry alerts.
- **Articles of Incorporation**: Manage strict governance rules and regulations.
- **Attendance**: Calculate quorums for meetings automatically.
- **AI Judicial Scrivener (葵さん)**: Chat-based assistant for legal queries and document drafting.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: Supabase (PostgreSQL)
- **AI**: Vercel AI SDK + OpenAI (GPT-4o)
- **Styling**: Tailwind CSS
- **Docs**: `docx` for Word export

## Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Setup**
   Copy `.env.example` to `.env.local` and add your keys:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   OPENAI_API_KEY=...
   ```

3. **Database Setup (Supabase)**
   Run the SQL found in `supabase/migrations/20251207_init.sql` in your Supabase SQL Editor to create the `organizations` and `profiles` tables.

4. **Run Development Server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000)

## Access Control & Pricing Plans

The application implements strict feature gating based on `organizations.plan`:
- **Free**: View-only, Trial AI functions.
- **Standard**: Enables Word Export, Archive Search.
- **Pro**: Bulk Notices, Advanced Legal Checks.
- **Enterprise**: Full Governance Reports.

*Modify `src/components/documents/minutes-form.tsx` or `src/lib/auth/access-control.ts` to test different tiers during development.*

## Deployment

Ready for deployment on Vercel. Ensure all environment variables are set in the Vercel Dashboard project settings.
