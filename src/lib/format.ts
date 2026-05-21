// 공통 포맷 유틸리티

// "2024-01" → "2024년 1월"
export function formatYearMonth(ym: string): string {
    const [year, month] = ym.split('-');
    return `${year}년 ${parseInt(month)}월`;
}

// "2024-01" → "1월" (차트 X축 단축 레이블)
export function formatMonthShort(ym: string): string {
    return `${parseInt(ym.split('-')[1])}월`;
}

// 배출량 숫자를 천 단위 구분자 포함 문자열로 변환
export function formatEmissions(value: number): string {
    return value.toLocaleString('ko-KR');
}

// 회사명 말줄임 — 차트 축 레이블처럼 공간이 제한된 곳에 사용
export function formatCompanyName(name: string, maxLength = 14): string {
    return name.length > maxLength ? `${name.slice(0, maxLength)}…` : name;
}

export const formatTooltipValue = (value: unknown, name: unknown) =>
  typeof value === 'number'
    ? [`${formatEmissions(value)} tCO₂e`, name as string]
    : ['-', name as string];
