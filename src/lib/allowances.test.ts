import { describe, expect, it } from 'vitest';
import { getAllowanceCostKrw, getRequiredAllowances, getSavedAllowances } from './allowances';

describe('allowance utilities', () => {
    it('배출량을 1 tCO₂e당 배출권 1개 기준으로 올림 환산한다', () => {
        expect(getRequiredAllowances(0)).toBe(0);
        expect(getRequiredAllowances(-1)).toBe(0);
        expect(getRequiredAllowances(12)).toBe(12);
        expect(getRequiredAllowances(12.1)).toBe(13);
    });

    it('필요 배출권 수량과 단가로 구매비용을 계산한다', () => {
        expect(getAllowanceCostKrw(13, 24550)).toBe(319150);
        expect(getAllowanceCostKrw(0, 24550)).toBe(0);
        expect(getAllowanceCostKrw(13, 0)).toBe(0);
    });

    it('감축 전후 배출량 기준으로 절감 배출권 수량을 계산한다', () => {
        expect(getSavedAllowances(100, 85)).toBe(15);
        expect(getSavedAllowances(100.2, 99.9)).toBe(1);
        expect(getSavedAllowances(80, 85)).toBe(0);
    });
});
