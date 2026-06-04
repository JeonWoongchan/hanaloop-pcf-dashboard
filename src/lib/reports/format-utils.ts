// 보고서 공통 날짜·숫자 포맷 유틸리티

export function formatReportDateTime(date: Date): string {
    const year = date.getFullYear();
    const month = pad2(date.getMonth() + 1);
    const day = pad2(date.getDate());
    const hours = pad2(date.getHours());
    const minutes = pad2(date.getMinutes());
    return `${year}-${month}-${day} ${hours}:${minutes}`;
}

export function pad2(value: number): string {
    return String(value).padStart(2, '0');
}
