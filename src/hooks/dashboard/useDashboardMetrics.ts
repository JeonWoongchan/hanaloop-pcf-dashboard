// 대시보드 집계 지표 계산 — companies 참조 변경 시에만 재계산
import {
    filterActivityRecordsByYear,
    filterByYear,
    getAnnualTotals,
    getAvailablePcfYears,
    getAvailableYears,
    getCombinedAvailableYears,
    getMergedMonthlyData,
    getMomYoyChange,
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
    getYoyChange,
    sumEmissions,
    sumPcf,
    type MonthlyTotal,
} from '@/lib/emissions';
import { getRiskAssessments, getRiskSummary } from '@/lib/risk';
import { ALLOWANCE_PRICE_KRW_PER_TCO2E } from '@/constants/risk';
import { useAllowancePrice } from '@/hooks/allowance-price/useAllowancePrice';
import type { ActivityRecord, Company } from '@/types';
import { useMemo } from 'react';

export type DashboardPcfSummary = {
    annualTotal: number;
    latestMonth: MonthlyTotal | null;
    yoyChange: number | null;
    momYoyChange: number | null;
    recordCount: number;
};

export type DashboardEmissionsSummary = {
    annualTotal: number;
    latestMonth: MonthlyTotal | null;
    yoyChange: number | null;
    momYoyChange: number | null;
    recordCount: number;
};

function getDashboardEmissionsSummary(
    allEmissions: Company['emissions'],
    selectedYearEmissions: Company['emissions'],
    monthlyTotals: MonthlyTotal[]
): DashboardEmissionsSummary {
    const latestMonth = monthlyTotals[monthlyTotals.length - 1] ?? null;

    return {
        annualTotal: sumEmissions(selectedYearEmissions),
        latestMonth,
        yoyChange: getYoyChange(allEmissions, monthlyTotals),
        momYoyChange: getMomYoyChange(allEmissions, latestMonth),
        recordCount: selectedYearEmissions.length,
    };
}

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
    const { data: allowanceData } = useAllowancePrice();
    const allowancePrice = allowanceData?.priceKrw ?? ALLOWANCE_PRICE_KRW_PER_TCO2E;

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

        const assessments = getRiskAssessments(companies, selectedYear, allowancePrice);
        const riskSummary = getRiskSummary(assessments);

        const filteredEmissions = filtered.flatMap((c) => c.emissions);
        const emissionsSummary = getDashboardEmissionsSummary(
            allEmissions,
            filteredEmissions,
            monthlyTotals
        );
        const scopeTotals = getScopeTotals(filteredEmissions);

        return {
            selectedYear,
            availableYears,
            yearlyTotals,
            pcfYearlyTotals,
            emissionsSummary,
            pcfSummary,
            totalByCompany,
            pcfByCompany,
            mergedMonthlyData: getMergedMonthlyData(monthlyByCompany, monthlyTotals),
            pcfMergedMonthlyData: getMergedMonthlyData(pcfMonthlyByCompany, pcfMonthlyTotals),
            riskSummary,
            scopeTotals,
        };
    }, [activityRecords, companies, year, allowancePrice]);
}
