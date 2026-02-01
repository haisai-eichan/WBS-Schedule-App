/**
 * 営業日計算エンジン
 * 日本の平日・祝日・休業日を考慮した日付計算を提供
 */

/**
 * 日本の祝日データ (2024-2030年)
 * 内閣府の祝日データに基づく
 */
const JAPANESE_HOLIDAYS: Record<number, string[]> = {
    2024: [
        '2024-01-01', // 元日
        '2024-01-08', // 成人の日
        '2024-02-11', // 建国記念の日
        '2024-02-12', // 振替休日
        '2024-02-23', // 天皇誕生日
        '2024-03-20', // 春分の日
        '2024-04-29', // 昭和の日
        '2024-05-03', // 憲法記念日
        '2024-05-04', // みどりの日
        '2024-05-05', // こどもの日
        '2024-05-06', // 振替休日
        '2024-07-15', // 海の日
        '2024-08-11', // 山の日
        '2024-08-12', // 振替休日
        '2024-09-16', // 敬老の日
        '2024-09-22', // 秋分の日
        '2024-09-23', // 振替休日
        '2024-10-14', // スポーツの日
        '2024-11-03', // 文化の日
        '2024-11-04', // 振替休日
        '2024-11-23', // 勤労感謝の日
    ],
    2025: [
        '2025-01-01', // 元日
        '2025-01-13', // 成人の日
        '2025-02-11', // 建国記念の日
        '2025-02-23', // 天皇誕生日
        '2025-02-24', // 振替休日
        '2025-03-20', // 春分の日
        '2025-04-29', // 昭和の日
        '2025-05-03', // 憲法記念日
        '2025-05-04', // みどりの日
        '2025-05-05', // こどもの日
        '2025-05-06', // 振替休日
        '2025-07-21', // 海の日
        '2025-08-11', // 山の日
        '2025-09-15', // 敬老の日
        '2025-09-23', // 秋分の日
        '2025-10-13', // スポーツの日
        '2025-11-03', // 文化の日
        '2025-11-23', // 勤労感謝の日
        '2025-11-24', // 振替休日
    ],
    2026: [
        '2026-01-01', // 元日
        '2026-01-12', // 成人の日
        '2026-02-11', // 建国記念の日
        '2026-02-23', // 天皇誕生日
        '2026-03-20', // 春分の日
        '2026-04-29', // 昭和の日
        '2026-05-03', // 憲法記念日
        '2026-05-04', // みどりの日
        '2026-05-05', // こどもの日
        '2026-05-06', // 振替休日
        '2026-07-20', // 海の日
        '2026-08-11', // 山の日
        '2026-09-21', // 敬老の日
        '2026-09-22', // 国民の休日
        '2026-09-23', // 秋分の日
        '2026-10-12', // スポーツの日
        '2026-11-03', // 文化の日
        '2026-11-23', // 勤労感謝の日
    ],
    2027: [
        '2027-01-01', // 元日
        '2027-01-11', // 成人の日
        '2027-02-11', // 建国記念の日
        '2027-02-23', // 天皇誕生日
        '2027-03-21', // 春分の日
        '2027-03-22', // 振替休日
        '2027-04-29', // 昭和の日
        '2027-05-03', // 憲法記念日
        '2027-05-04', // みどりの日
        '2027-05-05', // こどもの日
        '2027-07-19', // 海の日
        '2027-08-11', // 山の日
        '2027-09-20', // 敬老の日
        '2027-09-23', // 秋分の日
        '2027-10-11', // スポーツの日
        '2027-11-03', // 文化の日
        '2027-11-23', // 勤労感謝の日
    ],
    2028: [
        '2028-01-01', // 元日
        '2028-01-10', // 成人の日
        '2028-02-11', // 建国記念の日
        '2028-02-23', // 天皇誕生日
        '2028-03-20', // 春分の日
        '2028-04-29', // 昭和の日
        '2028-05-03', // 憲法記念日
        '2028-05-04', // みどりの日
        '2028-05-05', // こどもの日
        '2028-07-17', // 海の日
        '2028-08-11', // 山の日
        '2028-09-18', // 敬老の日
        '2028-09-22', // 秋分の日
        '2028-10-09', // スポーツの日
        '2028-11-03', // 文化の日
        '2028-11-23', // 勤労感謝の日
    ],
    2029: [
        '2029-01-01', // 元日
        '2029-01-08', // 成人の日
        '2029-02-11', // 建国記念の日
        '2029-02-12', // 振替休日
        '2029-02-23', // 天皇誕生日
        '2029-03-20', // 春分の日
        '2029-04-29', // 昭和の日
        '2029-04-30', // 振替休日
        '2029-05-03', // 憲法記念日
        '2029-05-04', // みどりの日
        '2029-05-05', // こどもの日
        '2029-07-16', // 海の日
        '2029-08-11', // 山の日
        '2029-09-17', // 敬老の日
        '2029-09-23', // 秋分の日
        '2029-09-24', // 振替休日
        '2029-10-08', // スポーツの日
        '2029-11-03', // 文化の日
        '2029-11-23', // 勤労感謝の日
    ],
    2030: [
        '2030-01-01', // 元日
        '2030-01-14', // 成人の日
        '2030-02-11', // 建国記念の日
        '2030-02-23', // 天皇誕生日
        '2030-03-20', // 春分の日
        '2030-04-29', // 昭和の日
        '2030-05-03', // 憲法記念日
        '2030-05-04', // みどりの日
        '2030-05-05', // こどもの日
        '2030-05-06', // 振替休日
        '2030-07-15', // 海の日
        '2030-08-11', // 山の日
        '2030-08-12', // 振替休日
        '2030-09-16', // 敬老の日
        '2030-09-23', // 秋分の日
        '2030-10-14', // スポーツの日
        '2030-11-03', // 文化の日
        '2030-11-04', // 振替休日
        '2030-11-23', // 勤労感謝の日
    ],
};

/**
 * 日付を YYYY-MM-DD 形式の文字列に変換
 */
function formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * 指定年の日本の祝日を取得
 */
export function getJapaneseHolidays(year: number): Date[] {
    const holidays = JAPANESE_HOLIDAYS[year] || [];
    return holidays.map(dateStr => new Date(dateStr));
}

/**
 * 土日判定
 */
export function isWeekend(date: Date): boolean {
    const day = date.getDay();
    return day === 0 || day === 6; // 0 = 日曜日, 6 = 土曜日
}

/**
 * 日本の祝日判定
 */
export function isJapaneseHoliday(date: Date): boolean {
    const year = date.getFullYear();
    const holidays = JAPANESE_HOLIDAYS[year] || [];
    const dateStr = formatDate(date);
    return holidays.includes(dateStr);
}

/**
 * カスタム休業日判定
 */
export function isCustomHoliday(date: Date, customHolidays: string[] = []): boolean {
    const dateStr = formatDate(date);
    return customHolidays.includes(dateStr);
}

/**
 * 営業日判定
 * @param date - 判定する日付
 * @param customHolidays - カスタム休業日のリスト (YYYY-MM-DD形式)
 */
export function isBusinessDay(date: Date, customHolidays: string[] = []): boolean {
    if (isWeekend(date)) return false;
    if (isJapaneseHoliday(date)) return false;
    if (isCustomHoliday(date, customHolidays)) return false;
    return true;
}

/**
 * 営業日を加算
 * @param startDate - 開始日
 * @param days - 加算する営業日数
 * @param customHolidays - カスタム休業日のリスト
 * @returns 加算後の日付
 */
export function addBusinessDays(
    startDate: Date,
    days: number,
    customHolidays: string[] = []
): Date {
    let currentDate = new Date(startDate);
    let remainingDays = days;

    while (remainingDays > 0) {
        currentDate.setDate(currentDate.getDate() + 1);
        if (isBusinessDay(currentDate, customHolidays)) {
            remainingDays--;
        }
    }

    return currentDate;
}

/**
 * 営業日数をカウント
 * @param startDate - 開始日
 * @param endDate - 終了日
 * @param customHolidays - カスタム休業日のリスト
 * @returns 営業日数 (startDate > endDate の場合は負の値を返す)
 */
export function countBusinessDays(
    startDate: Date,
    endDate: Date,
    customHolidays: string[] = []
): number {
    const isNegative = startDate > endDate;
    let start = new Date(startDate);
    let end = new Date(endDate);

    if (isNegative) {
        [start, end] = [end, start];
    }

    let count = 0;
    let currentDate = new Date(start);

    // 開始日そのものはカウントしない（翌日からカウント）
    // ただし、同日の場合は0を返す
    while (currentDate < end) {
        currentDate.setDate(currentDate.getDate() + 1);
        if (isBusinessDay(currentDate, customHolidays)) {
            count++;
        }
    }

    return isNegative ? -count : count;
}

/**
 * 営業日と時間を加算
 * @param startDate - 開始日
 * @param days - 加算する日数
 * @param hours - 加算する時間 (0-7)
 * @param customHolidays - カスタム休業日のリスト
 * @returns 加算後の日付
 * 
 * 注: 1営業日 = 8時間として計算
 * 例: 2日 + 4時間 = 2.5営業日
 */
export function addBusinessDaysAndHours(
    startDate: Date,
    days: number,
    hours: number,
    customHolidays: string[] = []
): Date {
    // 時間を日数に変換 (8時間 = 1日)
    const totalDays = days + hours / 8;
    const wholeDays = Math.floor(totalDays);
    const remainingHours = (totalDays - wholeDays) * 8;

    // まず整数日を加算
    let resultDate = addBusinessDays(startDate, wholeDays, customHolidays);

    // 残りの時間が4時間以上の場合、次の営業日に繰り越し
    if (remainingHours >= 4) {
        resultDate = addBusinessDays(resultDate, 1, customHolidays);
    }

    return resultDate;
}
