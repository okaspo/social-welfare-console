# デプロイガイド (Deployment Guide)

このプロジェクトを本番環境（Vercel推奨）にデプロイするための手順と設定情報です。

## 1. 前提条件 (Prerequisites)

*   **GitHub**: ソースコードがGitHubリポジトリにプッシュされていること。
*   **Vercel Account**: Vercelへのデプロイ権限があること。
*   **Supabase Project**: Supabaseプロジェクトが作成済みであること。
*   **OpenAI API Key**: チャットボット機能用。

## 2. 環境変数 (Environment Variables)

Vercelのプロジェクト設定画面で以下の環境変数を設定してください。

| 変数名 | 説明 | 例 / 備考 |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | SupabaseのプロジェクトURL | Settings > API で確認可能 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabaseの匿名パブリックキー | Settings > API で確認可能 |
| `OPENAI_API_KEY` | OpenAI APIキー | AIチャット機能に必須 |
| `NEXT_PUBLIC_SITE_URL` | 本番環境のURL | 例: `https://social-welfare-console.vercel.app` (OAuthリダイレクト用) |
| `DATABASE_URL` | トランザクションプーラー接続URL | Supabase Settings > Database > Connection String > Transaction Pooler (port 6543) |
| `DIRECT_URL` | 直接接続URL | Supabase Settings > Database > Connection String > Direct Connection (port 5432) |

> [!IMPORTANT]
> `NEXT_PUBLIC_` 以外の変数はサーバーサイドでのみアクセス可能です。APIキーなどの機密情報は必ずサーバーサイド変数として扱ってください。

## 3. Pythonランタイムの設定

このプロジェクトはドキュメント解析などにPythonを使用しています。
VercelでのPythonランタイム設定は `vercel.json` に定義されています。

```json
{
    "rewrites": [
        {
            "source": "/api/:path*",
            "destination": "/api/:path*"
        }
    ],
    "functions": {
        "api/**/*.py": {
            "runtime": "python3.9"
        }
    }
}
```

Pythonの依存パッケージは `requirements.txt` に記載されています：
*   `markitdown`
*   `supabase`

## 4. Supabase 設定

### データベースマイグレーション
`supabase/migrations` フォルダ内のSQLファイルをSupabaseのSQLエディタで実行し、必要なテーブルとRLSポリシーを作成してください。

### ストレージ設定
`documents` バケットなどが作成され、適切なアクセスポリシーが設定されていることを確認してください。

## 5. デプロイ手順 (Vercel)

1.  **Vercel Dashboard** にログイン。
2.  **Add New... > Project** を選択。
3.  GitHubリポジトリ `social-welfare-console` をインポート。
4.  **Configure Project** 画面で:
    *   **Framework Preset**: `Next.js` (自動検出されるはずです)
    *   **Environment Variables**: 上記の環境変数を入力。
5.  **Deploy** をクリック。

## 6. 動作確認

デプロイ完了後、発行されたドメインにアクセスし、以下の点を確認してください：
*   ログイン/サインアップが正常に機能するか。
*   ダッシュボードが表示されるか。
*   AIチャット (`/dashboard/chat`) が応答するか。
