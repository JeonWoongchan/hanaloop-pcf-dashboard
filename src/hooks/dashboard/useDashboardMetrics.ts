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
    // selectedYear 선계산 — useAllowancePrice(year)에 전달하기 위해 useMemo 밖에서 도출
    const allEmissionsForYears = useMemo(
        () => companies.flatMap((c) => c.emissions),
        [companies]
    );
    const availableYearsForPrice = useMemo(
        () =>
            getCombinedAvailableYears(
                getAvailableYears(allEmissionsForYears),
                getAvailablePcfYears(activityRecords)
            ),
        [allEmissionsForYears, activityRecords]
    );
    const selectedYearForPrice = getSelectedYear(year, availableYearsForPrice);

    // 선택 연도 기준 배출권 단가 조회
    const { data: allowanceData } = useAllowancePrice(selectedYearForPrice);
    const allowancePrice = allowanceData?.priceKrw ?? ALLOWANCE_PRICE_KRW_PER_TCO2E;

    return useMemo(() => {
        // useMemo 밖에서 이미 계산된 값을 재사용 — 이중 flatMap/getCombined 방지
        const allEmissions = allEmissionsForYears;
        const availableYears = availableYearsForPrice;
        const selectedYear = selectedYearForPrice;

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
    }, [activityRecords, companies, allowancePrice, allEmissionsForYears, availableYearsForPrice, selectedYearForPrice]);
}
