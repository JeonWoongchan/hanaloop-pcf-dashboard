// 공통 포맷 유틸리티

import type { LucideIcon } from 'lucide-react';
import { TrendingDown, TrendingUp } from 'lucide-react';

export const GHG_EMISSIONS_UNIT = 'tCO₂e' as const;
export const PCF_EMISSIONS_UNIT = 'kgCO₂e' as const;

// "2024-01" → "2024년 1월"
export function formatYearMonth(ym: string): string {
    const [year, month] = ym.split('-');
    return `${year}년 ${parseInt(month)}월`;
}

// "2026-05-22 14:30" → "2026년 5월 22일 14:30"
export function formatDateTime(dt: string): string {
    const [datePart, timePart] = dt.split(' ');
    const [year, month, day] = datePart.split('-');
    const base = `${year}년 ${parseInt(month)}월 ${parseInt(day)}일`;
    return timePart ? `${base} ${timePart}` : base;
}

// 현재 시각을 "YYYY-MM-DD HH:mm" 형식 문자열로 반환
export function formatNowToDateTime(): string {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

// "2024-01" → "1월" (차트 X축 단축 레이블)
export function formatMonthShort(ym: string): string {
    return `${parseInt(ym.split('-')[1])}월`;
}

// 배출량 숫자를 천 단위 구분자 포함 문자열로 변환
export function formatEmissions(value: number): string {
    return value.toLocaleString('ko-KR');
}

// PCF는 kgCO₂e 기준 소수값을 보존한다.
export function formatPcfEmissions(value: number): string {
    return value.toLocaleString('ko-KR', { maximumFractionDigits: 4 });
}

// 원화 금액을 대시보드 표시용으로 축약
export function formatKrw(value: number): string {
    const abs = Math.abs(value);
    if (abs >= 100000000) {
        return `${(value / 100000000).toLocaleString('ko-KR', {
            maximumFractionDigits: 1,
        })}억 원`;
    }
    if (abs >= 10000) {
        return `${Math.round(value / 10000).toLocaleString('ko-KR')}만 원`;
    }
    return `${value.toLocaleString('ko-KR')}원`;
}

// 천 단위 축약 — 차트 Y축 tick 레이블용 (예: 1500 → "1.5k")
export function formatKilo(value: number, decimals = 1): string {
    return `${(value / 1000).toFixed(decimals)}k`;
}

// 회사명 말줄임 — 차트 축 레이블처럼 공간이 제한된 곳에 사용
export function formatCompanyName(name: string, maxLength = 14): string {
    return name.length > maxLength ? `${name.slice(0, maxLength)}…` : name;
}

export const formatTooltipValue = (value: unknown, name: unknown) =>
    typeof value === 'number'
        ? [`${formatEmissions(value)} ${GHG_EMISSIONS_UNIT}`, String(name)]
        : ['-', String(name)];

export const formatPcfTooltipValue = (value: unknown, name: unknown) =>
    typeof value === 'number'
        ? [`${formatPcfEmissions(value)} ${PCF_EMISSIONS_UNIT}`, String(name)]
        : ['-', String(name)];

export type TrendProps = { label: string; className: string; Icon: LucideIcon | null };

// 전월 대비 변화율을 UI 표시용 레이블·색상·아이콘으로 변환
export function getTrendProps(change: number | null): TrendProps {
    if (change === null) return { label: '-', className: 'text-muted-foreground', Icon: null };
    const isDecrease = change < 0;
    return {
        label: `${isDecrease ? '' : '+'}${change.toFixed(1)}%`,
        className: isDecrease ? 'text-success' : 'text-destructive',
        Icon: isDecrease ? TrendingDown : TrendingUp,
    };
}
