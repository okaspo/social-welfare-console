// Seasonal Avatar Helper
// Get appropriate avatar based on current season

export function getSeasonalAvatar(
    assistantCodeName: 'aoi' | 'aki' | 'ami',
    month?: number
): string {
    const currentMonth = month || new Date().getMonth() + 1; // 1-12

    let season: 'spring' | 'summer' | 'autumn' | 'winter';

    if (currentMonth >= 3 && currentMonth <= 5) {
        season = 'spring';
    } else if (currentMonth >= 6 && currentMonth <= 8) {
        season = 'summer';
    } else if (currentMonth >= 9 && currentMonth <= 11) {
        season = 'autumn';
    } else {
        season = 'winter';
    }

    // Placeholder paths - replace with actual avatar URLs
    return `/avatars/${assistantCodeName}_${season}.png`;
}

export function getSeasonName(month?: number): string {
    const currentMonth = month || new Date().getMonth() + 1;

    if (currentMonth >= 3 && currentMonth <= 5) return '春';
    if (currentMonth >= 6 && currentMonth <= 8) return '夏';
    if (currentMonth >= 9 && currentMonth <= 11) return '秋';
    return '冬';
}
