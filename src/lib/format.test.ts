import { afterEach, describe, expect, it, vi } from 'vitest';
import {
    formatCompanyName,
    formatDateTime,
    formatEmissions,
    formatKilo,
    formatKrw,
    formatMonthShort,
    formatNowToDateTime,
    formatTooltipValue,
    formatYearMonth,
    getTrendProps,
} from './format';

afterEach(() => {
    vi.useRealTimers();
});

describe('format utilities', () => {
    it('연월·일시 문자열을 한국어 표시 형식으로 변환한다', () => {
        expect(formatYearMonth('2024-01')).toBe('2024년 1월');
        expect(formatMonthShort('2024-11')).toBe('11월');
        expect(formatDateTime('2026-05-22 14:30')).toBe('2026년 5월 22일 14:30');
        expect(formatDateTime('2026-05-22')).toBe('2026년 5월 22일');
    });

    it('현재 시각을 Action Note 저장 형식으로 포맷한다', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2026, 4, 22, 5, 6, 0));

        expect(formatNowToDateTime()).toBe('2026-05-22 05:06');
    });

    it('배출량·금액·천 단위 숫자를 대시보드 표시용으로 변환한다', () => {
        expect(formatEmissions(1234567)).toBe('1,234,567');
        expect(formatKrw(123456789)).toBe('1.2억 원');
        expect(formatKrw(45000)).toBe('5만 원');
        expect(formatKrw(9999)).toBe('9,999원');
        expect(formatKilo(1500)).toBe('1.5k');
        expect(formatKilo(1500, 0)).toBe('2k');
    });

    it('공간이 제한된 차트 축에 맞게 회사명을 줄인다', () => {
        expect(formatCompanyName('Acme Manufacturing', 8)).toBe('Acme Man…');
        expect(formatCompanyName('Acme', 8)).toBe('Acme');
    });

    it('Recharts tooltip 값을 tCO₂e 단위와 함께 반환한다', () => {
        expect(formatTooltipValue(1234, 'Scope 1')).toEqual(['1,234 tCO₂e', 'Scope 1']);
        expect(formatTooltipValue(null, 'Scope 1')).toEqual(['-', 'Scope 1']);
    });

    it('증감률을 라벨·색상·아이콘 정책으로 변환한다', () => {
        const noChange = getTrendProps(null);
        const increase = getTrendProps(12.345);
        const decrease = getTrendProps(-7.89);

        expect(noChange).toMatchObject({
            label: '-',
            className: 'text-muted-foreground',
            Icon: null,
        });
        expect(increase.label).toBe('+12.3%');
        expect(increase.className).toBe('text-destructive');
        expect(increase.Icon).not.toBeNull();
        expect(decrease.label).toBe('-7.9%');
        expect(decrease.className).toBe('text-success');
        expect(decrease.Icon).not.toBeNull();
    });
});
