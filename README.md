# Social Welfare Console (社会福祉法人AI運営支援システム)

**社会福祉法人（Social Welfare Corporation）の運営を効率化し、コンプライアンスを強化するAI統合型プラットフォーム。**

## 主な機能 (Core Features)

### 1. Documents & Minutes (議事録・書類作成)
- 理事会・評議員会の議事録を1クリックで生成。
- 録音データやメモからのAIドラフト作成。
- **[PRO機能]** Word形式(.docx)での出力対応。

### 2. Governance Management (ガバナンス管理)
- **役員管理**: 任期（理事2年、評議員4年）の自動計算と満了アラート。
- **定款ライブラリ**: 法人の憲法である定款や規程をクラウドで一元管理（RAG対応）。
- **勤怠管理**: 理事会への出席状況と定足数確認。

### 3. AI Judicial Scrivener "Aoi" (S級AI事務局 葵さん)
- **Prompt Layering System**:
  ユーザーの契約プランに応じて、AIの「能力」が変化する積層型プロンプトエンジンを採用。
  - **Free**: 基本的な応答のみ。
  - **Standard**: 文書作成のフォーマット遵守。
  - **Pro**: 司法書士レベルの法的リスクチェック（ハルシネーション制御強化）。
  - **Enterprise**: 経営戦略・監査視点でのアドバイス。

### 4. Admin Console (管理者機能)
- **プロンプト管理 (`/admin/prompts`)**:
  AIの挙動を決定するシステムプロンプトをWeb画面から編集・テスト可能。
  開発者がコードを変更することなく、プロンプトエンジニアリングを行えます。

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: Supabase (PostgreSQL + RLS)
- **AI Engine**: Vercel AI SDK + OpenAI (GPT-4o)
- **Styling**: Tailwind CSS + shadcn/ui
- **Infrastructure**: Vercel

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Setup
Create `.env.local` and add your keys:
```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=... # for Admin Console
OPENAI_API_KEY=...
```

### 3. Database Migration
Run the consolidated SQL script (provided in hand-over documents) to set up:
- `organizations`, `profiles` (Auth & Data)
- `prompt_modules` (AI Logic)
- RLS Policies

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

## Access Levels

機能制限は `organizations.plan_id` (`free`, `standard`, `pro`, `enterprise`) によって制御されます。
テスト時は `src/app/admin/prompts` のテスト機能を使用するか、DBの値を直接書き換えて検証してください。
