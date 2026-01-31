# Output Format Example

レビュー結果は以下のテーブル形式で出力すること。

## Council Assessment

| Group | Persona | Status | Concern / Approval (判定コメント) |
| :--- | :--- | :--- | :--- |
| **Biz** | CEO | ✅/⚠️ | (ここにビジネス視点のコメント) |
| **Biz** | CXO | ✅/⚠️ | (ここにUX視点のコメント) |
| **Biz** | CAIO | ✅/⚠️ | (ここにAI視点のコメント) |
| **Biz** | CLO | ✅/⚠️ | (ここに法務視点のコメント) |
| **Biz** | CFO | ✅/⚠️ | (ここにコスト視点のコメント) |
| **Biz** | User | ✅/⚠️ | (ここにユーザー視点のコメント) |
| **Tech**| Lead-FE | ✅/🛑 | (ここにフロントエンド視点のコメント) |
| **Tech**| Lead-BE | ✅/🛑 | (ここにバックエンド視点のコメント) |
| **Tech**| SecOps | ✅/🛑 | (ここにセキュリティ視点のコメント) |
| **Tech**| QA | ✅/🛑 | (ここにQA視点のコメント) |

**最終判定 (Verdict):** [Proceed (進行) / Modify (修正) / Reject (却下)]
