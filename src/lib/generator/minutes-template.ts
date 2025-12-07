
export interface MinutesData {
    corporationName: string
    date: string
    startTime: string
    endTime: string
    venue: string
    totalDirectors: number
    attendedDirectors: number
    totalAuditors: number
    attendedAuditors: number
    chairperson: string
    agendas: {
        title: string
        content: string
        result: 'approved' | 'acknowledged' | 'pending'
    }[]
    signatories: string[]
}

export function generateMinutes(data: MinutesData): string {
    // Safe date formatting
    let dateStr = "____年__月__日"
    try {
        if (data.date) {
            const dateObj = new Date(data.date)
            dateStr = `${dateObj.getFullYear()}年${dateObj.getMonth() + 1}月${dateObj.getDate()}日`
        }
    } catch (e) { }

    return `社会福祉法人${data.corporationName} 理解会議事録

1. 日時
   ${dateStr}  ${data.startTime} ～ ${data.endTime}

2. 場所
   ${data.venue}

3. 出席者
   理事総数 ${data.totalDirectors}名  出席理事 ${data.attendedDirectors}名
   監事総数 ${data.totalAuditors}名  出席監事 ${data.attendedAuditors}名

4. 議長
   ${data.chairperson}

5. 審議事項
${data.agendas.map((item, i) => `
   第${i + 1}号議案  ${item.title}
   (内容)
   ${item.content}
   (結果)
   ${item.result === 'approved' ? '出席理事の全員一致をもって原案どおり承認可決された。' : '報告がなされ、承認された。'}
`).join('\n')}

以上、議事の経過の要領及びその結果を明確にするため、この議事録を作成し、議長及び署名人がこれに記名押印する。

${dateStr}

社会福祉法人${data.corporationName} 理事会

      議長    ${data.chairperson}     (印)

      署名人  ${data.signatories[0] || '__________'}     (印)

      署名人  ${data.signatories[1] || '__________'}     (印)
`
}
