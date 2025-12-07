
export type MeetingType = 'board_of_directors' | 'board_of_councilors'

export interface MeetingData {
    type: MeetingType
    date: string
    time: string
    venue: string
    agendas: {
        title: string
        proposer?: string
    }[]
    corporationName: string
    representativeName: string
}

export function generateNotice(data: MeetingData): string {
    const isBoard = data.type === 'board_of_directors'
    const title = isBoard ? '理事会招集通知書' : '評議員会招集通知書'
    const attendees = isBoard ? '理事・監事 各位' : '評議員 各位'

    // Format Date safely
    let dateStr = "____年__月__日"
    try {
        if (data.date) {
            const dateObj = new Date(data.date)
            dateStr = `${dateObj.getFullYear()}年${dateObj.getMonth() + 1}月${dateObj.getDate()}日`
        }
    } catch (e) {
        // Fallback
    }

    const agendaText = data.agendas.map((item, i) => `   第${i + 1}号議案  ${item.title}`).join('\n')

    return `${dateStr}

${attendees}

${data.corporationName}
理事長 ${data.representativeName}

${title}

拝啓

時下ますますご清栄のこととお慶び申し上げます。
さて、下記のとおり第〇回${isBoard ? '理事会' : '評議員会'}を開催いたしますので、ご出席くださいますようご通知申し上げます。

敬具

記

1. 日時
   ${dateStr} ${data.time}

2. 場所
   ${data.venue}

3. 目的事項（議題）
${agendaText}

以上
`
}
