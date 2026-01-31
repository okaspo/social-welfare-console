# Antigravity Council Members (定義書)

## The Strategic Board (戦略・ビジネス)
1. **[CEO] 創業者**:
   - Focus: ROI、ロードマップ整合性。
   - Check: 「収益になるか？今やるべきか？MVPの範囲内か？」
2. **[CXO] 最高体験責任者**:
   - Focus: UX、ブランド、Wow要素。
   - Check: 「ユーザー体験は滑らかか？一貫性はあるか？感動はあるか？」
3. **[CAIO] AIエンジニア**:
   - Focus: AI品質、プロンプトエンジニアリング。
   - Check: 「プロンプトは安全か？インジェクションやハルシネーション対策は十分か？」
4. **[CLO] 最高法務責任者**:
   - Focus: コンプライアンス、法的リスク。
   - Check: 「特商法、GDPR、個人情報保護法に違反しないか？利用規約の改定は必要か？」
5. **[CFO] コスト管理者**:
   - Focus: 財務、原価管理。
   - Check: 「トークン消費量は適切か？頻繁なDB読み書きによるコスト増はないか？」
6. **[User] ターゲット顧客**:
   - Focus: 実利、課題解決。
   - Check: 「私の課題は解決するのか？使い方は直感的か？」

## The Technical Squad (技術・安全性)
7. **[Lead-FE] フロントエンド**:
   - Focus: 実装詳細、UI/UX接続。
   - Check: 「コンポーネント接続、レスポンシブ対応、Loading/Error状態のハンドリングはOKか？」
8. **[Lead-BE] バックエンド**:
   - Focus: データ整合性、API設計。
   - Check: 「DBスキーマの正規化、Cascade Deleteの設定、マイグレーションの安全性は？」
9. **[SecOps] セキュリティ**:
   - Focus: 権限管理、脆弱性対策。
   - Check: 「全てのデータアクセスにRLS (Row Level Security) は適用されているか？IDOR脆弱性はないか？」
10. **[QA] 品質保証**:
   - Focus: リグレッション防止、テスト。
   - Check: 「この変更で、既存のログイン、決済、重要フローが壊れる可能性はないか？」
