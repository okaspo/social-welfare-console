/**
 * Japanese Era Conversion Utility
 * 和暦変換ユーティリティ
 * 
 * Converts Western dates to Japanese era format (令和、平成、昭和)
 */

interface JapaneseEra {
    name: string;
    shortName: string;
    startDate: Date;
    endDate: Date | null;
}

const ERAS: JapaneseEra[] = [
    {
        name: '令和',
        shortName: 'R',
        startDate: new Date('2019-05-01'),
        endDate: null
    },
    {
        name: '平成',
        shortName: 'H',
        startDate: new Date('1989-01-08'),
        endDate: new Date('2019-04-30')
    },
    {
        name: '昭和',
        shortName: 'S',
        startDate: new Date('1926-12-25'),
        endDate: new Date('1989-01-07')
    },
    {
        name: '大正',
        shortName: 'T',
        startDate: new Date('1912-07-30'),
        endDate: new Date('1926-12-24')
    },
    {
        name: '明治',
        shortName: 'M',
        startDate: new Date('1868-01-25'),
        endDate: new Date('1912-07-29')
    }
];

/**
 * Get the Japanese era for a given date
 */
export function getJapaneseEra(date: Date | string): JapaneseEra | null {
    const d = typeof date === 'string' ? new Date(date) : date;

    for (const era of ERAS) {
        if (d >= era.startDate && (era.endDate === null || d <= era.endDate)) {
            return era;
        }
    }
    return null;
}

/**
 * Calculate the year in Japanese era
 */
export function getJapaneseYear(date: Date | string): number {
    const d = typeof date === 'string' ? new Date(date) : date;
    const era = getJapaneseEra(d);

    if (!era) return d.getFullYear();

    const eraYear = d.getFullYear() - era.startDate.getFullYear() + 1;
    return eraYear;
}

/**
 * Convert date to Japanese era format
 * 
 * @param date - Date to convert
 * @param format - Output format: 'full' | 'short' | 'numeric'
 * @returns Formatted Japanese era date string
 * 
 * @example
 * toJapaneseEra('2024-12-21', 'full')   // "令和6年12月21日"
 * toJapaneseEra('2024-12-21', 'short')  // "R6.12.21"
 * toJapaneseEra('1990-03-15', 'full')   // "平成2年3月15日"
 */
export function toJapaneseEra(
    date: Date | string,
    format: 'full' | 'short' | 'numeric' = 'full'
): string {
    const d = typeof date === 'string' ? new Date(date) : date;

    if (isNaN(d.getTime())) {
        return '';
    }

    const era = getJapaneseEra(d);
    if (!era) {
        // Fallback to Western format for very old dates
        return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
    }

    const year = getJapaneseYear(d);
    const month = d.getMonth() + 1;
    const day = d.getDate();

    // First year is written as "元年" (gannen)
    const yearStr = year === 1 ? '元' : year.toString();

    switch (format) {
        case 'full':
            return `${era.name}${yearStr}年${month}月${day}日`;
        case 'short':
            return `${era.shortName}${year}.${month}.${day}`;
        case 'numeric':
            return `${era.name}${yearStr}年`;
        default:
            return `${era.name}${yearStr}年${month}月${day}日`;
    }
}

/**
 * Convert date to Japanese era format for birth dates (年月 only, for privacy)
 * 
 * @example
 * toJapaneseEraBirthDate('1965-03-15') // "昭和40年3月生"
 */
export function toJapaneseEraBirthDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;

    if (isNaN(d.getTime())) {
        return '';
    }

    const era = getJapaneseEra(d);
    if (!era) {
        return `${d.getFullYear()}年${d.getMonth() + 1}月生`;
    }

    const year = getJapaneseYear(d);
    const month = d.getMonth() + 1;
    const yearStr = year === 1 ? '元' : year.toString();

    return `${era.name}${yearStr}年${month}月生`;
}

/**
 * Calculate age from birth date
 */
export function calculateAge(birthDate: Date | string): number {
    const birth = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
    const today = new Date();

    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }

    return age;
}

/**
 * Format date for official documents (役員名簿 style)
 * 
 * @example
 * formatOfficialDate('1965-03-15') // "昭和40年 3月15日"
 */
export function formatOfficialDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;

    if (isNaN(d.getTime())) {
        return '';
    }

    const era = getJapaneseEra(d);
    if (!era) {
        return `${d.getFullYear()}年${(d.getMonth() + 1).toString().padStart(2, ' ')}月${d.getDate().toString().padStart(2, ' ')}日`;
    }

    const year = getJapaneseYear(d);
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const yearStr = year === 1 ? '元' : year.toString();

    return `${era.name}${yearStr.padStart(2, ' ')}年${month.toString().padStart(2, ' ')}月${day.toString().padStart(2, ' ')}日`;
}
