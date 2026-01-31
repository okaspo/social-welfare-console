# DB Security & Performance Checklist

スキーマ変更時は以下の項目をチェックしてください。

## Security
- [ ] **RLS (Row Level Security)**: 全てのテーブルにポリシーが適用されているか？
- [ ] **pgvector**: AI機能用の `vector` 拡張は有効化されているか？
- [ ] **Sensitive Data**: パスワードやトークンが生で保存されていないか？

## Performance
- [ ] **Indexing**: 検索クエリ(`where`, `orderBy`)で使用されるカラムにインデックスはあるか？
- [ ] **Relations**: 外部キー制約は適切か？（Cascade Deleteの要否確認）
