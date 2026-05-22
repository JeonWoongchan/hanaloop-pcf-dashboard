// 대시보드 집계 지표 계산 훅 — companies 참조 변경 시에만 재계산

import {
    filterByYear,
    filterActivityRecordsByYear,
    getAnnualTotals,
    getAvailableYears,
    getAvailablePcfYears,
    getCombinedAvailableYears,
    getMergedMonthlyData,
    getMonthlyByCompany,
    getMonthlyTotals,
    getPcfMomYoyChange,
    getPcfMonthlyTotals,
    getPcfYoyChange,
    getSelectedYear,
    getScopeTotals,
    getTotalByCompany,
    sumPcf,
    type MonthlyTotal,
} from '@/lib/emissions';
import { getRiskAssessments, getRiskSummary } from '@/lib/risk';
import type { ActivityRecord, Company } from '@/types';
import { useMemo } from 'react';

export type DashboardPcfSummary = {
    annualTotal: number;
    latestMonth: MonthlyTotal | null;
    yoyChange: number | null;
    momYoyChange: number | null;
    recordCount: number;
};

function getDashboardPcfSummary(
    activityRecords: ActivityRecord[],
    selectedYear: number
): DashboardPcfSummary {
    const selectedYearRecords = filterActivityRecordsByYear(activityRecords, selectedYear);
    const monthlyTotals = getPcfMonthlyTotals(selectedYearRecords);
    const latestMonth = monthlyTotals[monthlyTotals.length - 1] ?? null;

    return {
        annualTotal: sumPcf(selectedYearRecords),
        latestMonth,
        yoyChange: getPcfYoyChange(activityRecords, monthlyTotals),
        momYoyChange: getPcfMomYoyChange(activityRecords, latestMonth),
        recordCount: selectedYearRecords.length,
    };
}

// 대시보드 표시에 필요한 집계 지표 일괄 계산 및 메모이제이션
export function useDashboardMetrics(
    companies: Company[],
    year?: number | null,
    activityRecords: ActivityRecord[] = []
) {
    return useMemo(() => {
        const allEmissions = companies.flatMap((c) => c.emissions);
        const availableYears = getCombinedAvailableYears(
            getAvailableYears(allEmissions),
            getAvailablePcfYears(activityRecords)
        );
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
        const pcfSummary = getDashboardPcfSummary(activityRecords, selectedYear);

        return {
            selectedYear,
            availableYears,
            yearlyTotals,
            pcfSummary,
            totalByCompany,
            mergedMonthlyData: getMergedMonthlyData(monthlyByCompany, monthlyTotals),
            riskSummary,
            scopeTotals,
        };
    }, [activityRecords, companies, year]);
}
