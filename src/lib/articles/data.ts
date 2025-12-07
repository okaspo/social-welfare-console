
export type ArticleCategory = 'basic' | 'rule' | 'manual'

export interface ArticleDoc {
    id: string
    title: string
    category: ArticleCategory
    lastUpdated: string
    content: string
}

export const ARTICLE_CATEGORIES: Record<ArticleCategory, string> = {
    basic: '定款・基本規程',
    rule: '業務執行規程',
    manual: 'マニュアル・様式'
}

const SAMPLE_TEIKAN = `
# 社会福祉法人〇〇会 定款

## 第1章 総則

（目的）
第1条 この社会福祉法人は、多様な福祉サービスがその利用者の意向を尊重して総合的に提供されるよう創意工夫することにより、利用者が個人の尊厳を保持しつつ、自立した生活を地域社会において営むことができるよう支援することを目的として、次の社会福祉事業を行う。

（名称）
第2条 この法人は、社会福祉法人〇〇会という。

（経営の原則）
第3条 この法人は、社会福祉事業の主たる担い手としてふさわしい事業を確実、効果的かつ適正に行うため、自主的にその経営基盤の強化を図るとともに、提供する福祉サービスの質の向上並びに事業経営の透明性の確保を図らなければならない。

## 第2章 評議員

（評議員の定数）
第4条 この法人に評議員〇名以上〇名以内を置く。

（評議員の選任及び解任）
第5条 評議員の選任及び解任は、評議員選任・解任委員会において行う。
`

const SAMPLE_RULE = `
# 経理規程

## 第1章 総則

（目的）
第1条 この規程は、社会福祉法人〇〇会（以下「法人」という。）の経理事務の基準を定め、その適正な運営に資することを目的とする。

（適用範囲）
第2条 法人の経理事務に関しては、法令及び定款に別段の定めがある場合を除くほか、この規程の定めるところによる。

（会計年度）
第3条 法人の会計年度は、毎年4月1日に始まり、翌年3月31日に終わる。
`

export const MOCK_ARTICLES: ArticleDoc[] = [
    {
        id: 'teikan',
        title: '社会福祉法人〇〇会 定款',
        category: 'basic',
        lastUpdated: '2024-04-01',
        content: SAMPLE_TEIKAN
    },
    {
        id: 'keiri',
        title: '経理規程',
        category: 'rule',
        lastUpdated: '2023-04-01',
        content: SAMPLE_RULE
    },
    {
        id: 'yakuin_hoshu',
        title: '役員報酬規程',
        category: 'rule',
        lastUpdated: '2023-04-01',
        content: '# 役員報酬規程\n\n（目的）\n第1条...'
    }
]
