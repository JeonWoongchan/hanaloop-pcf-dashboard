'use client';

import { AsyncStateBoundary } from '@/components/shared/async-state-boundary';
import { ChartSkeleton, MetricGridSkeleton } from '@/components/shared/loading-skeletons';
import { YearSelector } from '@/components/shared/year-selector';
import { useAllActivityRecords } from '@/hooks/activity-records/useActivityRecords';
import { useCompanies } from '@/hooks/companies/useCompanies';
import { useDashboardMetrics } from '@/hooks/dashboard/useDashboardMetrics';
import dynamic from 'next/dynamic';
import { parseAsInteger, useQueryState } from 'nuqs';
import { KpiCards } from './kpi-cards';

const EmissionTrendChart = dynamic(
    () => import('./emission-trend-chart').then((m) => ({ default: m.EmissionTrendChart })),
    { loading: () => <ChartSkeleton className="h-92" />, ssr: false }
);
const CompanyBarChart = dynamic(
    () => import('./company-bar-chart').then((m) => ({ default: m.CompanyBarChart })),
    { loading: () => <ChartSkeleton className="h-79" />, ssr: false }
);
const YearlyComparisonChart = dynamic(
    () =>
        import('./dashboard-yearly-comparison-chart').then((m) => ({
            default: m.DashboardYearlyComparisonChart,
        })),
    { loading: () => <ChartSkeleton className="h-52" />, ssr: false }
);

function DashboardSkeleton() {
    return (
        <div className="space-y-6">
            <MetricGridSkeleton />
            <ChartSkeleton className="h-92" />
            <ChartSkeleton className="h-79" />
            <ChartSkeleton className="h-52" />
        </div>
    );
}

export function DashboardContent() {
    const { data: companies, isLoading, error, refetch } = useCompanies();
    const {
        data: activityRecords,
        isLoading: isActivityRecordsLoading,
        error: activityRecordsError,
        refetch: refetchActivityRecords,
    } = useAllActivityRecords();
    const [yearParam, setYearParam] = useQueryState('year', parseAsInteger);

    const {
        selectedYear,
        availableYears,
        yearlyTotals,
        pcfYearlyTotals,
        pcfSummary,
        totalByCompany,
        pcfByCompany,
        mergedMonthlyData,
        pcfMergedMonthlyData,
        riskSummary,
        scopeTotals,
    } = useDashboardMetrics(companies ?? [], yearParam, activityRecords ?? []);

    return (
        <AsyncStateBoundary
            isLoading={isLoading || isActivityRecordsLoading}
            error={error ?? activityRecordsError}
            isEmpty={!companies?.length}
            loadingFallback={<DashboardSkeleton />}
            emptyMessage="등록된 관리 대상 회사가 없습니다."
            onRetry={() => {
                void refetch();
                void refetchActivityRecords();
            }}
        >
            <div className="space-y-6">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">대시보드</h2>
                        <p className="text-muted-foreground">
                            {selectedYear}년 온실가스 및 PCF 현황 요약
                        </p>
                    </div>
                    <YearSelector
                        years={availableYears}
                        value={selectedYear}
                        onChangeAction={(y) => void setYearParam(y)}
                    />
                </div>

                <KpiCards
                    year={selectedYear}
                    pcfSummary={pcfSummary}
                    scopeTotals={scopeTotals}
                    riskSummary={riskSummary}
                />

                <EmissionTrendChart
                    year={selectedYear}
                    emissionsData={mergedMonthlyData}
                    pcfData={pcfMergedMonthlyData}
                    companies={companies ?? []}
                />

                <CompanyBarChart
                    year={selectedYear}
                    emissionsData={totalByCompany}
                    pcfData={pcfByCompany}
                />

                <YearlyComparisonChart
                    emissionsData={yearlyTotals}
                    pcfData={pcfYearlyTotals}
                    selectedYear={selectedYear}
                />
            </div>
        </AsyncStateBoundary>
    );
}
