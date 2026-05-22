// 대시보드 집계 지표 계산 — companies 참조 변경 시에만 재계산
import {
    filterActivityRecordsByYear,
    filterByYear,
    getAnnualTotals,
    getAvailablePcfYears,
    getAvailableYears,
    getCombinedAvailableYears,
    getMergedMonthlyData,
    getMonthlyByCompany,
    getMonthlyTotals,
    getPcfAnnualTotals,
    getPcfByCompany,
    getPcfMomYoyChange,
    getPcfMonthlyByCompany,
    getPcfMonthlyTotals,
    getPcfYoyChange,
    getScopeTotals,
    getSelectedYear,
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
    allActivityRecords: ActivityRecord[],
    selectedYearRecords: ActivityRecord[]
): DashboardPcfSummary {
    const monthlyTotals = getPcfMonthlyTotals(selectedYearRecords);
    const latestMonth = monthlyTotals[monthlyTotals.length - 1] ?? null;

    return {
        annualTotal: sumPcf(selectedYearRecords),
        latestMonth,
        yoyChange: getPcfYoyChange(allActivityRecords, monthlyTotals),
        momYoyChange: getPcfMomYoyChange(allActivityRecords, latestMonth),
        recordCount: selectedYearRecords.length,
    };
}

// 대시보드 표시에 필요한 GHG/PCF 집계를 한 번에 계산한다.
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

        const selectedYearActivityRecords = filterActivityRecordsByYear(
            activityRecords,
            selectedYear
        );
        const pcfMonthlyTotals = getPcfMonthlyTotals(selectedYearActivityRecords);
        const pcfMonthlyByCompany = getPcfMonthlyByCompany(companies, selectedYearActivityRecords);
        const pcfByCompany = getPcfByCompany(companies, activityRecords, selectedYear);
        const pcfYearlyTotals = getPcfAnnualTotals(activityRecords);
        const pcfSummary = getDashboardPcfSummary(activityRecords, selectedYearActivityRecords);

        const assessments = getRiskAssessments(companies, selectedYear);
        const riskSummary = getRiskSummary(assessments);

        const filteredEmissions = filtered.flatMap((c) => c.emissions);
        const scopeTotals = getScopeTotals(filteredEmissions);

        return {
            selectedYear,
            availableYears,
            yearlyTotals,
            pcfYearlyTotals,
            pcfSummary,
            totalByCompany,
            pcfByCompany,
            mergedMonthlyData: getMergedMonthlyData(monthlyByCompany, monthlyTotals),
            pcfMergedMonthlyData: getMergedMonthlyData(pcfMonthlyByCompany, pcfMonthlyTotals),
            riskSummary,
            scopeTotals,
        };
    }, [activityRecords, companies, year]);
}
