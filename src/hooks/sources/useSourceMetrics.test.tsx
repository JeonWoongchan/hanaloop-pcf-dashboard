import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { Company } from '@/types';
import { useSourceMetrics } from './useSourceMetrics';

const sourceCompaniesFixture: Company[] = [
    {
        id: 'a',
        name: 'Alpha',
        country: 'KR',
        emissions: [
            { yearMonth: '2024-01', source: 'diesel', emissions: 10 },
            { yearMonth: '2024-01', source: 'shipping', emissions: 70 },
            { yearMonth: '2024-02', source: 'shipping', emissions: 30 },
            { yearMonth: '2025-01', source: 'shipping', emissions: 999 },
        ],
    },
    {
        id: 'b',
        name: 'Beta',
        country: 'US',
        emissions: [
            { yearMonth: '2024-01', source: 'electricity', emissions: 40 },
            { yearMonth: '2024-02', source: 'diesel', emissions: 60 },
        ],
    },
];

function readSourceMetrics(
    companies: Company[],
    year: number,
    sourceId: string | null
): ReturnType<typeof useSourceMetrics> {
    let result: ReturnType<typeof useSourceMetrics> | null = null;

    function Probe() {
        result = useSourceMetrics(companies, year, sourceId);
        return null;
    }

    renderToStaticMarkup(<Probe />);
    if (!result) throw new Error('useSourceMetrics probe failed');
    return result;
}

describe('useSourceMetrics', () => {
    it('선택 연도 기준 배출원 랭킹과 드릴다운 데이터를 계산한다', () => {
        const metrics = readSourceMetrics(sourceCompaniesFixture, 2024, 'diesel');

        expect(metrics.allSources).toEqual([
            { source: 'shipping', total: 100, scope: 3 },
            { source: 'diesel', total: 70, scope: 1 },
            { source: 'electricity', total: 40, scope: 2 },
        ]);
        expect(metrics.activeSourceId).toBe('diesel');
        expect(metrics.activeSource).toEqual({ source: 'diesel', total: 70, scope: 1 });
        expect(metrics.scopeTotals).toEqual({ 1: 70, 2: 40, 3: 100 });
        expect(metrics.companyBreakdown).toEqual([
            { id: 'b', name: 'Beta', country: 'US', total: 60 },
            { id: 'a', name: 'Alpha', country: 'KR', total: 10 },
        ]);
        expect(metrics.monthlyTrend).toEqual([
            { month: '2024-01', total: 10 },
            { month: '2024-02', total: 60 },
        ]);
        expect(metrics.totalEmissions).toBe(210);
    });

    it('유효하지 않은 배출원 파라미터는 랭킹 1위 배출원으로 fallback한다', () => {
        const metrics = readSourceMetrics(sourceCompaniesFixture, 2024, 'invalid-source');

        expect(metrics.activeSourceId).toBe('shipping');
        expect(metrics.activeSource).toEqual({ source: 'shipping', total: 100, scope: 3 });
        expect(metrics.companyBreakdown).toEqual([
            { id: 'a', name: 'Alpha', country: 'KR', total: 100 },
        ]);
    });

    it('선택 연도에 배출 데이터가 없으면 빈 드릴다운 상태를 반환한다', () => {
        const metrics = readSourceMetrics(sourceCompaniesFixture, 2026, null);

        expect(metrics.allSources).toEqual([]);
        expect(metrics.activeSourceId).toBeNull();
        expect(metrics.activeSource).toBeNull();
        expect(metrics.scopeTotals).toEqual({ 1: 0, 2: 0, 3: 0 });
        expect(metrics.companyBreakdown).toEqual([]);
        expect(metrics.monthlyTrend).toEqual([]);
        expect(metrics.totalEmissions).toBe(0);
    });
});
