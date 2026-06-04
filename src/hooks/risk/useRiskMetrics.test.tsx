import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ALLOWANCE_PRICE_KRW_PER_TCO2E } from '@/constants/risk';
import type { Company } from '@/types';
import { useRiskMetrics } from './useRiskMetrics';

const riskMetricsCompaniesFixture: Company[] = [
    {
        id: 'high',
        name: 'High Logistics',
        country: 'SG',
        emissions: [
            { yearMonth: '2024-01', source: 'shipping', emissions: 100 },
            { yearMonth: '2024-02', source: 'shipping', emissions: 100 },
            { yearMonth: '2024-03', source: 'shipping', emissions: 100 },
            { yearMonth: '2024-04', source: 'shipping', emissions: 130 },
            { yearMonth: '2024-05', source: 'shipping', emissions: 130 },
            { yearMonth: '2024-06', source: 'shipping', emissions: 130 },
            { yearMonth: '2025-01', source: 'shipping', emissions: 10 },
        ],
    },
    {
        id: 'low',
        name: 'Low Office',
        country: 'NO',
        emissions: [
            { yearMonth: '2024-01', source: 'electricity', emissions: 50 },
            { yearMonth: '2025-01', source: 'electricity', emissions: 20 },
        ],
    },
];

function readRiskMetrics(
    companies: Company[],
    year?: number | null
): ReturnType<typeof useRiskMetrics> {
    let result: ReturnType<typeof useRiskMetrics> | null = null;
    // useAllowancePrice가 QueryClient를 필요로 하므로 래퍼 제공
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    function Probe() {
        result = useRiskMetrics(companies, year);
        return null;
    }

    renderToStaticMarkup(
        <QueryClientProvider client={queryClient}>
            <Probe />
        </QueryClientProvider>
    );
    if (!result) throw new Error('useRiskMetrics probe failed');
    return result;
}

describe('useRiskMetrics', () => {
    it('선택 연도 기준 리스크 평가 목록과 요약을 반환한다', () => {
        const metrics = readRiskMetrics(riskMetricsCompaniesFixture, 2024);

        expect(metrics.selectedYear).toBe(2024);
        expect(metrics.availableYears).toEqual([2025, 2024]);
        expect(metrics.assessments.map((item) => item.id)).toEqual(['high', 'low']);
        expect(metrics.summary).toMatchObject({
            // DB 미로드 시 폴백 상수로 계산 — (690 + 50) × ALLOWANCE_PRICE_KRW_PER_TCO2E
            totalAllowanceCostKrw: 740 * ALLOWANCE_PRICE_KRW_PER_TCO2E,
            highRiskCount: 1,
            increasingCompaniesCount: 1,
            improvingCount: 0,
        });
    });

    it('요청 연도가 데이터에 없으면 최신 연도로 fallback한다', () => {
        const metrics = readRiskMetrics(riskMetricsCompaniesFixture, 2026);

        expect(metrics.selectedYear).toBe(2025);
        expect(metrics.assessments.map((item) => item.annualEmissions)).toEqual([20, 10]);
    });
});
