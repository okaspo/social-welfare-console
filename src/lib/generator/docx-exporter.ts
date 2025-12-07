
import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel } from 'docx'
import { saveAs } from 'file-saver'
import { MeetingData } from './notice-template'

export async function exportNoticeToDocx(data: MeetingData) {
    const isBoard = data.type === 'board_of_directors'
    const titleText = isBoard ? '理事会招集通知書' : '評議員会招集通知書'
    const attendeesText = isBoard ? '理事・監事 各位' : '評議員 各位'

    let dateStr = "____年__月__日"
    try {
        if (data.date) {
            const dateObj = new Date(data.date)
            dateStr = `${dateObj.getFullYear()}年${dateObj.getMonth() + 1}月${dateObj.getDate()}日`
        }
    } catch (e) { }

    const doc = new Document({
        sections: [{
            properties: {},
            children: [
                // Date (Right Aligned)
                new Paragraph({
                    alignment: AlignmentType.RIGHT,
                    children: [new TextRun(dateStr)],
                }),
                new Paragraph({ text: "" }), // Spacer

                // Attendees (Left Aligned)
                new Paragraph({
                    children: [new TextRun({ text: attendeesText, bold: true })],
                }),
                new Paragraph({ text: "" }),

                // Corporation Name (Right Aligned)
                new Paragraph({
                    alignment: AlignmentType.RIGHT,
                    children: [new TextRun(data.corporationName)],
                }),
                // ID/Representative (Right Aligned)
                new Paragraph({
                    alignment: AlignmentType.RIGHT,
                    children: [new TextRun(`理事長  ${data.representativeName}`)],
                }),
                new Paragraph({ text: "" }),
                new Paragraph({ text: "" }),

                // Title (Center, Bold)
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    heading: HeadingLevel.TITLE,
                    children: [new TextRun({ text: titleText, bold: true, size: 32 })], // size is half-points
                }),
                new Paragraph({ text: "" }),
                new Paragraph({ text: "" }),

                // Greeting
                new Paragraph({
                    children: [new TextRun("拝啓")],
                }),
                new Paragraph({ text: "" }),
                new Paragraph({
                    children: [new TextRun(`時下ますますご清栄のこととお慶び申し上げます。さて、下記のとおり第〇回${isBoard ? '理事会' : '評議員会'}を開催いたしますので、ご出席くださいますようご通知申し上げます。`)],
                }),
                new Paragraph({ text: "" }),
                new Paragraph({
                    alignment: AlignmentType.RIGHT,
                    children: [new TextRun("敬具")],
                }),
                new Paragraph({ text: "" }),

                // "Ki" (Center)
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun("記")],
                }),
                new Paragraph({ text: "" }),

                // 1. Date
                new Paragraph({
                    children: [new TextRun("1. 日時")],
                }),
                new Paragraph({
                    indent: { left: 720 }, // ~0.5 inch
                    children: [new TextRun(`   ${dateStr}  ${data.time}`)],
                }),
                new Paragraph({ text: "" }),

                // 2. Venue
                new Paragraph({
                    children: [new TextRun("2. 場所")],
                }),
                new Paragraph({
                    indent: { left: 720 },
                    children: [new TextRun(`   ${data.venue}`)],
                }),
                new Paragraph({ text: "" }),

                // 3. Agenda
                new Paragraph({
                    children: [new TextRun("3. 目的事項（議題）")],
                }),
                ...data.agendas.map((item, i) =>
                    new Paragraph({
                        indent: { left: 720 },
                        children: [new TextRun(`第${i + 1}号議案  ${item.title}`)]
                    })
                ),

                new Paragraph({ text: "" }),
                new Paragraph({ text: "" }),
                new Paragraph({
                    alignment: AlignmentType.RIGHT,
                    children: [new TextRun("以上")],
                }),
            ],
        }],
    })

    const blob = await Packer.toBlob(doc)
    saveAs(blob, `招集通知_${dateStr}.docx`)
}

import { MinutesData } from './minutes-template'

export async function exportMinutesToDocx(data: MinutesData) {
    let dateStr = "____年__月__日"
    try {
        if (data.date) {
            const dateObj = new Date(data.date)
            dateStr = `${dateObj.getFullYear()}年${dateObj.getMonth() + 1}月${dateObj.getDate()}日`
        }
    } catch (e) { }

    const doc = new Document({
        sections: [{
            properties: {},
            children: [
                // Title
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    heading: HeadingLevel.TITLE,
                    children: [new TextRun({ text: `社会福祉法人${data.corporationName} 理事会議事録`, bold: true, size: 32 })],
                }),
                new Paragraph({ text: "" }),
                new Paragraph({ text: "" }),

                // 1. Date
                new Paragraph({ children: [new TextRun("1. 日時")] }),
                new Paragraph({
                    indent: { left: 720 },
                    children: [new TextRun(`   ${dateStr}  ${data.startTime} ～ ${data.endTime}`)],
                }),
                new Paragraph({ text: "" }),

                // 2. Venue
                new Paragraph({ children: [new TextRun("2. 場所")] }),
                new Paragraph({
                    indent: { left: 720 },
                    children: [new TextRun(`   ${data.venue}`)],
                }),
                new Paragraph({ text: "" }),

                // 3. Attendees
                new Paragraph({ children: [new TextRun("3. 出席者")] }),
                new Paragraph({
                    indent: { left: 720 },
                    children: [new TextRun(`   理事総数 ${data.totalDirectors}名  出席理事 ${data.attendedDirectors}名`)],
                }),
                new Paragraph({
                    indent: { left: 720 },
                    children: [new TextRun(`   監事総数 ${data.totalAuditors}名  出席監事 ${data.attendedAuditors}名`)],
                }),
                new Paragraph({ text: "" }),

                // 4. Chairperson
                new Paragraph({ children: [new TextRun("4. 議長")] }),
                new Paragraph({
                    indent: { left: 720 },
                    children: [new TextRun(`   ${data.chairperson}`)],
                }),
                new Paragraph({ text: "" }),

                // 5. Agendas
                new Paragraph({ children: [new TextRun("5. 審議事項")] }),
                ...data.agendas.flatMap((item, i) => [
                    new Paragraph({
                        indent: { left: 720 },
                        children: [new TextRun({ text: `第${i + 1}号議案  ${item.title}`, bold: true })]
                    }),
                    new Paragraph({
                        indent: { left: 1440 },
                        children: [new TextRun("(内容)")]
                    }),
                    new Paragraph({
                        indent: { left: 1440 },
                        children: [new TextRun(item.content)]
                    }),
                    new Paragraph({
                        indent: { left: 1440 },
                        children: [new TextRun("(結果)")]
                    }),
                    new Paragraph({
                        indent: { left: 1440 },
                        children: [new TextRun(item.result === 'approved' ? '出席理事の全員一致をもって原案どおり承認可決された。' : '報告がなされ、承認された。')]
                    }),
                    new Paragraph({ text: "" })
                ]),

                // Closing
                new Paragraph({ text: "" }),
                new Paragraph({
                    children: [new TextRun("以上、議事の経過の要領及びその結果を明確にするため、この議事録を作成し、議長及び署名人がこれに記名押印する。")]
                }),
                new Paragraph({ text: "" }),
                new Paragraph({ text: "" }),

                // Signature Date
                new Paragraph({
                    children: [new TextRun(dateStr)]
                }),
                new Paragraph({ text: "" }),

                // Corp Name
                new Paragraph({
                    children: [new TextRun(`社会福祉法人${data.corporationName} 理事会`)]
                }),
                new Paragraph({ text: "" }),

                // Signatures
                new Paragraph({
                    indent: { left: 720 },
                    children: [new TextRun(`議長    ${data.chairperson}     (印)`)]
                }),
                new Paragraph({ text: "" }),
                new Paragraph({ text: "" }),
                new Paragraph({
                    indent: { left: 720 },
                    children: [new TextRun(`署名人  ${data.signatories[0] || '__________'}     (印)`)]
                }),
                new Paragraph({ text: "" }),
                new Paragraph({ text: "" }),
                new Paragraph({
                    indent: { left: 720 },
                    children: [new TextRun(`署名人  ${data.signatories[1] || '__________'}     (印)`)]
                }),
            ]
        }]
    })

    const blob = await Packer.toBlob(doc)
    saveAs(blob, `理事会議事録_${dateStr}.docx`)
}

export async function exportProposalToDocx(data: MinutesData) {
    let dateStr = "____年__月__日"
    try {
        if (data.date) {
            const dateObj = new Date(data.date)
            dateStr = `${dateObj.getFullYear()}年${dateObj.getMonth() + 1}月${dateObj.getDate()}日`
        }
    } catch (e) { }

    const doc = new Document({
        sections: [{
            properties: {},
            children: [
                // Title
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    heading: HeadingLevel.TITLE,
                    children: [new TextRun({ text: `社会福祉法人${data.corporationName} 理事会付議事項提案書`, bold: true, size: 32 })],
                }),
                new Paragraph({ text: "" }),
                new Paragraph({ text: "" }),

                // 1. Date
                new Paragraph({ children: [new TextRun("1. 日時")] }),
                new Paragraph({
                    indent: { left: 720 },
                    children: [new TextRun(`   ${dateStr}  ${data.startTime} ～ ${data.endTime}`)],
                }),
                new Paragraph({ text: "" }),

                // 2. Venue
                new Paragraph({ children: [new TextRun("2. 場所")] }),
                new Paragraph({
                    indent: { left: 720 },
                    children: [new TextRun(`   ${data.venue}`)],
                }),
                new Paragraph({ text: "" }),

                // 3. Proposer (Chairperson)
                new Paragraph({ children: [new TextRun("3. 提案者")] }),
                new Paragraph({
                    indent: { left: 720 },
                    children: [new TextRun(`   理事長  ${data.chairperson}`)],
                }),
                new Paragraph({ text: "" }),

                // 4. Proposed Items (Agendas) - No Result
                new Paragraph({ children: [new TextRun("4. 提案事項")] }),
                ...data.agendas.flatMap((item, i) => [
                    new Paragraph({
                        indent: { left: 720 },
                        children: [new TextRun({ text: `第${i + 1}号議案  ${item.title}`, bold: true })]
                    }),
                    new Paragraph({
                        indent: { left: 1440 },
                        children: [new TextRun("(提案理由・内容)")]
                    }),
                    new Paragraph({
                        indent: { left: 1440 },
                        children: [new TextRun(item.content)]
                    }),
                    new Paragraph({ text: "" })
                ]),

                // Closing
                new Paragraph({ text: "" }),
                new Paragraph({
                    children: [new TextRun("以上、理事会への付議事項として提案いたします。")]
                }),
                new Paragraph({ text: "" }),
                new Paragraph({ text: "" }),

                // Date
                new Paragraph({
                    alignment: AlignmentType.RIGHT,
                    children: [new TextRun(dateStr)]
                }),
                new Paragraph({
                    alignment: AlignmentType.RIGHT,
                    children: [new TextRun(`提案者  ${data.chairperson}  (印)`)]
                }),
            ]
        }]
    })

    const blob = await Packer.toBlob(doc)
    saveAs(blob, `理事会付議事項提案書_${dateStr}.docx`)
}
