// 대시보드 집계 지표 계산 훅 — companies 참조 변경 시에만 재계산

import {
    filterByYear,
    getAnnualTotals,
    getAvailableYears,
    getImprovingCompanyCount,
    getMergedMonthlyData,
    getMonthlyByCompany,
    getMonthlyTotals,
    getMonthOverMonthChange,
    getSelectedYear,
    getTotalByCompany,
} from '@/lib/emissions';
import type { Company } from '@/types';
import { useMemo } from 'react';

// 대시보드 표시에 필요한 집계 지표 일괄 계산 및 메모이제이션
export function useDashboardMetrics(companies: Company[], year?: number | null) {
    return useMemo(() => {
        const allEmissions = companies.flatMap((c) => c.emissions);
        const availableYears = getAvailableYears(allEmissions);
        const selectedYear = getSelectedYear(year, availableYears);

        const filtered = companies.map((c) => ({
            ...c,
            emissions: filterByYear(c.emissions, selectedYear),
        }));

        const monthlyTotals = getMonthlyTotals(filtered);
        const monthlyByCompany = getMonthlyByCompany(filtered);
        return {
            selectedYear,
            availableYears,
            // 연도 필터 적용 전 전체 데이터로 연도별 비교 차트용 집계
            yearlyTotals: getAnnualTotals(allEmissions),
            monthlyTotals,
            momChange: getMonthOverMonthChange(monthlyTotals),
            totalByCompany: getTotalByCompany(filtered),
            mergedMonthlyData: getMergedMonthlyData(monthlyByCompany, monthlyTotals),
            improvingCount: getImprovingCompanyCount(filtered),
        };
    }, [companies, year]);
}
