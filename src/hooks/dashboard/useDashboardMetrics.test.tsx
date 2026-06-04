import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ActivityRecord, Company } from '@/types';
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

const dashboardActivityRecordsFixture: ActivityRecord[] = [
    {
        id: 'pcf-2023-a',
        companyId: 'a',
        activityDate: '2023-01-31',
        yearMonth: '2023-01',
        activityType: '전기',
        description: '한국전력',
        quantity: 100,
        unit: 'kWh',
        source: 'electricity',
        scope: 2,
        emissionFactorKg: 0.456,
        emissionsKg: 45.6,
        emissionsTco2e: 0.0456,
        importFileName: 'test.xlsx',
        importRowNumber: 1,
        createdAt: '2026-05-22T00:00:00.000Z',
    },
    {
        id: 'pcf-2024-a',
        companyId: 'a',
        activityDate: '2024-01-31',
        yearMonth: '2024-01',
        activityType: '전기',
        description: '한국전력',
        quantity: 200,
        unit: 'kWh',
        source: 'electricity',
        scope: 2,
        emissionFactorKg: 0.456,
        emissionsKg: 91.2,
        emissionsTco2e: 0.0912,
        importFileName: 'test.xlsx',
        importRowNumber: 2,
        createdAt: '2026-05-22T00:00:00.000Z',
    },
    {
        id: 'pcf-2024-b',
        companyId: 'b',
        activityDate: '2024-02-29',
        yearMonth: '2024-02',
        activityType: '운송',
        description: '트럭',
        quantity: 20,
        unit: 'ton-km',
        source: 'shipping',
        scope: 3,
        emissionFactorKg: 3.5,
        emissionsKg: 70,
        emissionsTco2e: 0.07,
        importFileName: 'test.xlsx',
        importRowNumber: 3,
        createdAt: '2026-05-22T00:00:00.000Z',
    },
];

function readDashboardMetrics(
    companies: Company[],
    year?: number | null,
    activityRecords: ActivityRecord[] = []
): ReturnType<typeof useDashboardMetrics> {
    let result: ReturnType<typeof useDashboardMetrics> | null = null;
    // useAllowancePrice가 QueryClient를 필요로 하므로 래퍼 제공
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    function Probe() {
        result = useDashboardMetrics(companies, year, activityRecords);
        return null;
    }

    renderToStaticMarkup(
        <QueryClientProvider client={queryClient}>
            <Probe />
        </QueryClientProvider>
    );
    if (!result) throw new Error('useDashboardMetrics probe failed');
    return result;
}

describe('useDashboardMetrics', () => {
    it('대시보드 표시용 파생 지표를 선택 연도 기준으로 계산한다', () => {
        const metrics = readDashboardMetrics(
            dashboardCompaniesFixture,
            2024,
            dashboardActivityRecordsFixture
        );

        expect(metrics.selectedYear).toBe(2024);
        expect(metrics.availableYears).toEqual([2024, 2023]);
        expect(metrics.pcfSummary).toEqual({
            annualTotal: 161.2,
            latestMonth: { month: '2024-02', total: 70 },
            yoyChange: expect.any(Number),
            momYoyChange: null,
            recordCount: 2,
        });
        expect(metrics.pcfSummary.yoyChange).toBeCloseTo(253.51, 2);
        expect(metrics.emissionsSummary).toEqual({
            annualTotal: 400,
            latestMonth: { month: '2024-02', total: 175 },
            yoyChange: expect.any(Number),
            momYoyChange: null,
            recordCount: 5,
        });
        expect(metrics.emissionsSummary.yoyChange).toBeCloseTo(433.33, 2);
        expect(metrics.totalByCompany).toEqual([
            { id: 'a', name: 'Alpha', country: 'KR', total: 300 },
            { id: 'b', name: 'Beta', country: 'US', total: 100 },
        ]);
        expect(
            metrics.pcfByCompany.map(({ id, name, country, total }) => ({
                id,
                name,
                country,
                total,
            }))
        ).toEqual([
            { id: 'a', name: 'Alpha', country: 'KR', total: 91.2 },
            { id: 'b', name: 'Beta', country: 'US', total: 70 },
        ]);
        expect(metrics.pcfYearlyTotals).toEqual([
            { year: 2023, total: 45.6 },
            { year: 2024, total: 161.2 },
        ]);
        expect(metrics.pcfMergedMonthlyData).toEqual([
            { month: '2024-01', Alpha: 91.2, Beta: 0, [TOTAL_EMISSIONS_KEY]: 91.2 },
            { month: '2024-02', Alpha: 0, Beta: 70, [TOTAL_EMISSIONS_KEY]: 70 },
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
    });

    it('URL 연도가 데이터에 없으면 최신 사용 가능 연도로 fallback한다', () => {
        const metrics = readDashboardMetrics(dashboardCompaniesFixture, 2026);

        expect(metrics.selectedYear).toBe(2024);
        expect(metrics.pcfSummary.recordCount).toBe(0);
    });

    it('활동 데이터에만 있는 연도도 selectedYear 후보에 포함한다', () => {
        const pcfOnlyYearRecord: ActivityRecord = {
            ...dashboardActivityRecordsFixture[0]!,
            id: 'pcf-2025-a',
            activityDate: '2025-03-31',
            yearMonth: '2025-03',
            emissionsKg: 12.5,
            emissionsTco2e: 0.0125,
        };
        const metrics = readDashboardMetrics(dashboardCompaniesFixture, null, [
            ...dashboardActivityRecordsFixture,
            pcfOnlyYearRecord,
        ]);

        expect(metrics.availableYears).toEqual([2025, 2024, 2023]);
        expect(metrics.selectedYear).toBe(2025);
        expect(metrics.pcfSummary.annualTotal).toBe(12.5);
        expect(metrics.pcfSummary.recordCount).toBe(1);
    });
});
