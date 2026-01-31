---
name: prisma-guard
description: Prisma ORMを用いた安全なデータベース変更管理。手動操作を禁止し自動化を強制する。
---

# Prisma Operation Rules

DBスキーマを変更する際は、必ず以下の手順を遵守すること。

## 手順
1. **事前チェック (Checklist)**
   - `resources/checklist.md` を読み込み、セキュリティ項目（RLS, pgvector等）を確認する。
   - `prisma/schema.prisma` の変更内容が既存データを破壊しないか確認する。

2. **ローカル適用 (Local Migration)**
   - 変更後は、直ちに以下のコマンドを実行してローカルDBを同期する。
   - `npx prisma migrate dev`

3. **本番ガード (Prod Guard)**
   - `package.json` の `scripts` に以下が含まれているか確認し、なければ追加提案する。
   - `"migrate:deploy": "prisma migrate deploy"`
   - Vercel Build Commandに `npx prisma migrate deploy && next build` を設定するよう指示する。

4. **禁止事項**
   - Supabaseダッシュボードでのテーブル直接編集やSQL実行は禁止。
