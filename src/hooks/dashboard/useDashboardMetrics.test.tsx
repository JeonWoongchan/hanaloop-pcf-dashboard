import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { Company } from '@/types';
import { TOTAL_EMISSIONS_KEY } from '@/lib/emissions';
import { useDashboardMetrics } from './useDashboardMetrics';

const dashboardCompaniesFixture: Company[] = [
    {
        id: 'a',
        name: 'Alpha',
        country: 'KR',
        emissions: [
            { yearMonth: '2023-01', source: 'diesel', emissions: 50 },
            { yearMonth: '2024-01', source: 'diesel', emissions: 100 },
            { yearMonth: '2024-01', source: 'electricity', emissions: 50 },
            { yearMonth: '2024-02', source: 'shipping', emissions: 150 },
        ],
    },
    {
        id: 'b',
        name: 'Beta',
        country: 'US',
        emissions: [
            { yearMonth: '2023-01', source: 'electricity', emissions: 25 },
            { yearMonth: '2024-01', source: 'electricity', emissions: 75 },
            { yearMonth: '2024-02', source: 'diesel', emissions: 25 },
        ],
    },
];

function readDashboardMetrics(
    companies: Company[],
    year?: number | null
): ReturnType<typeof useDashboardMetrics> {
    let result: ReturnType<typeof useDashboardMetrics> | null = null;

    function Probe() {
        result = useDashboardMetrics(companies, year);
        return null;
    }

    renderToStaticMarkup(<Probe />);
    if (!result) throw new Error('useDashboardMetrics probe failed');
    return result;
}

describe('useDashboardMetrics', () => {
    it('대시보드 표시용 파생 지표를 선택 연도 기준으로 계산한다', () => {
        const metrics = readDashboardMetrics(dashboardCompaniesFixture, 2024);

        expect(metrics.selectedYear).toBe(2024);
        expect(metrics.availableYears).toEqual([2024, 2023]);
        expect(metrics.annualTotal).toBe(400);
        expect(metrics.latestMonth).toEqual({ month: '2024-02', total: 175 });
        expect(metrics.totalByCompany).toEqual([
            { id: 'a', name: 'Alpha', country: 'KR', total: 300 },
            { id: 'b', name: 'Beta', country: 'US', total: 100 },
        ]);
        expect(metrics.scopeTotals).toEqual({ 1: 125, 2: 125, 3: 150 });
        expect(metrics.yearlyTotals).toEqual([
            { year: 2023, total: 75 },
            { year: 2024, total: 400 },
        ]);
        expect(metrics.mergedMonthlyData).toEqual([
            { month: '2024-01', Alpha: 150, Beta: 75, [TOTAL_EMISSIONS_KEY]: 225 },
            { month: '2024-02', Alpha: 150, Beta: 25, [TOTAL_EMISSIONS_KEY]: 175 },
        ]);
        expect(metrics.yoyChange).toBeCloseTo(433.33, 2);
        expect(metrics.momYoyChange).toBeNull();
    });

    it('URL 연도가 데이터에 없으면 최신 사용 가능 연도로 fallback한다', () => {
        const metrics = readDashboardMetrics(dashboardCompaniesFixture, 2026);

        expect(metrics.selectedYear).toBe(2024);
        expect(metrics.annualTotal).toBe(400);
    });
});
