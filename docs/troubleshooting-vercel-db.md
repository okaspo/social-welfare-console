# Vercel & Supabase 接続トラブルシューティング (エラー P1001)

エラー `Error: P1001: Can't reach database server` は、Vercelがポート `5432` でSupabaseデータベースに接続できないことを意味します。

## 1. Supabaseのネットワーク制限を確認する（可能性大）
1.  **Supabase Dashboard** > **Project Settings** > **Database** > **Network Restrictions** に移動します。
2.  "Network Restrictions" が有効になっているか確認してください。
3.  **有効な場合**: 一般的なアクセス (`0.0.0.0/0`) を許可するか、Vercel Integrationを使用してVercelのIPを自動的に許可する必要があります。
    *   *一時的な修正:* ビルドを確認するために、一時的に `0.0.0.0/0` を許可リストに追加してください。
4.  **IPv6サポート**: VercelプロジェクトがIPv6に依存している場合、"Use IPv6" が正しく設定されていることを確認してください（SupabaseプーラーはIPv6に移行しています）。
    *   *注:* エラーは **Direct URL** (`db.[id].supabase.co`) に接続していることを示しており、これはIPv4をサポートしています。

## 2. Vercelの環境変数を確認する
1.  **Vercel Dashboard** > **Settings** > **Environment Variables** に移動します。
2.  `DATABASE_URL` と `DIRECT_URL` が設定されていることを確認してください。
    *   `DATABASE_URL`: `postgres://postgres.[project]:[パスワード]@[project].supabase.co:5432/postgres` (プーラーの場合は`6543`)。
    *   `DIRECT_URL`: ポート `5432` である必要があります。
3.  **重要**: パスワードに特殊文字が含まれている場合は、URLエンコードされていることを確認してください。

## 3. プロジェクトが停止していないか確認する
1.  Supabase Dashboardに移動します。
2.  プロジェクトが「Paused」（非アクティブのため停止中）になっている場合は、"Restore" をクリックしてください。
