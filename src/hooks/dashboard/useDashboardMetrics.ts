// 대시보드 집계 지표 계산 훅 — companies 참조 변경 시에만 재계산

import {
    filterByYear,
    getAnnualTotals,
    getAvailableYears,
    getMergedMonthlyData,
    getMomYoyChange,
    getMonthlyByCompany,
    getMonthlyTotals,
    getSelectedYear,
    getScopeTotals,
    getTotalByCompany,
    getYoyChange,
    sumEmissions,
} from '@/lib/emissions';
import { getRiskAssessments, getRiskSummary } from '@/lib/risk';
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
        const totalByCompany = getTotalByCompany(filtered);
        const yearlyTotals = getAnnualTotals(allEmissions);
        // 리스크 평가
        const assessments = getRiskAssessments(companies, selectedYear);
        const riskSummary = getRiskSummary(assessments);

        const filteredEmissions = filtered.flatMap((c) => c.emissions);
        const scopeTotals = getScopeTotals(filteredEmissions);
        const annualTotal = sumEmissions(filteredEmissions);
        const latestMonth = monthlyTotals[monthlyTotals.length - 1] ?? null;
        const yoyChange = getYoyChange(allEmissions, monthlyTotals);
        const momYoyChange = getMomYoyChange(allEmissions, latestMonth);

        return {
            selectedYear,
            availableYears,
            yearlyTotals,
            monthlyTotals,
            annualTotal,
            latestMonth,
            totalByCompany,
            mergedMonthlyData: getMergedMonthlyData(monthlyByCompany, monthlyTotals),
            riskSummary,
            scopeTotals,
            yoyChange,
            momYoyChange,
        };
    }, [companies, year]);
}
