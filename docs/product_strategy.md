# Product Strategy & Marketing Logic

## 1. Design Philosophy
- **Concept**: "S-Class AI Secretariat" (S級AI事務局)
- **Aesthetics**: Premium, State-of-the-art, Vibrant.
- **Key Elements**: Glassmorphism, tailored HSL color palettes, smooth gradients, micro-animations.
- **Goal**: "Wow" the user at first glance. Avoid generic bootstrap/tailwind looks.

## 2. Pricing Plans & Sales Logic

### Free (フリー)
*   **Target**: 事務担当者・管理者（個人的な動作確認・お試し）
*   **Purpose**: 「本当にウチの定款に合った議事録が作れるの？」という疑念を払拭するためのデモ環境。
*   **Paywall**: 議事録は画面で見れるが、**Wordダウンロード不可**。実務で使うにはアップグレードが必要。

### Standard (スタンダード) - ¥24,800/月
*   **Target**: 小規模法人（保育園1園など、単体施設）
*   **Value Prop**: 「点の作業」の効率化。
*   **Sales Logic**: 「月額2.5万円は、複合機のリース代や消耗品費と同程度。毎回の文字起こしと清書にかかる数時間の残業がなくなるなら安い投資」。
*   **Upgrade Trigger**: 会議頻度増、日程調整の負担増。

### Pro (プロ) - ¥54,800/月
*   **Target**: 中規模法人（事務局があり、会議調整が負担）
*   **Value Prop**: 「線のプロセス」の効率化。
*   **Sales Logic**: 「月額5.5万円は、司法書士や外部専門家の顧問料（5〜10万円）より割安。招集手続きと定足数管理までAIが代行し、手続きミスによる決議無効リスクを回避」。
*   **Key Features**: 招集通知一括送信、出欠管理、委任状自動生成。

### Enterprise (エンタープライズ) - ¥98,000/月
*   **Target**: 大規模法人・グループ本部（複数施設を統括管理したい）
*   **Value Prop**: ガバナンス確立と報告業務の全自動化。
*   **Sales Logic**:
    1.  **Cost**: 事務職員1名のコスト（20万円〜）の半額以下。
    2.  **Authority**: **10万円未満なので理事長/施設長の専決処分（ハンコのみ）で導入可能**。
    3.  **Benefit**: 現場職員がスマホ入力するだけで、年度末の事業報告書が自動完成。

## 3. Marketing Strategy (The Funnel)
1.  **Attract**: Free plan for "Proof of Concept".
2.  **Convert**: Hit the "Word Download" wall -> Standard Plan.
3.  **Upsell**: Hit the "Meeting Management" wall (Schedule/Quorum) -> Pro Plan.
4.  **Expert**: Hit the "Multi-facility/Governance" wall -> Enterprise Plan.

## 4. UI/UX Directives
- **Paywall awareness**: Even for lower plans, show buttons for higher plan features (e.g., "Send Convocation") but trigger an upsell modal or video when clicked.
- **Micro-copy**: Use the specific sales logic phrases (e.g., "Equivalent to photocopier lease") in the UI to rationalize the purchase.
