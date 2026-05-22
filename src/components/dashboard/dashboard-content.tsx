'use client';

// 대시보드 홈 데이터 패칭 및 전체 레이아웃 구성

import { AsyncStateBoundary } from '@/components/shared/async-state-boundary';
import { ChartSkeleton, MetricGridSkeleton } from '@/components/shared/loading-skeletons';
import { YearSelector } from '@/components/shared/year-selector';
import { useAllActivityRecords } from '@/hooks/activity-records/useActivityRecords';
import { useCompanies } from '@/hooks/companies/useCompanies';
import { useDashboardMetrics } from '@/hooks/dashboard/useDashboardMetrics';
import dynamic from 'next/dynamic';
import { parseAsInteger, useQueryState } from 'nuqs';
import { KpiCards } from './kpi-cards';

// recharts 번들을 초기 JS에서 분리하기 위한 동적 임포트
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
        import('@/components/shared/yearly-comparison-chart').then((m) => ({
            default: m.YearlyComparisonChart,
        })),
    { loading: () => <ChartSkeleton className="h-52" />, ssr: false }
);

// 대시보드 레이아웃 전용 로딩 스켈레톤
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

// 대시보드 전체 컨텐츠 렌더링
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
        pcfSummary,
        totalByCompany,
        mergedMonthlyData,
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
                    data={mergedMonthlyData}
                    companies={companies ?? []}
                />

                <CompanyBarChart year={selectedYear} data={totalByCompany} />

                <YearlyComparisonChart
                    data={yearlyTotals}
                    selectedYear={selectedYear}
                    title="연도별 총 배출량 추이"
                    description="전체 회사 합산 · 연도별 누적 온실가스 배출량 (tCO₂e)"
                    helpText="전체 기업 합산 기준 연도별 배출량 추이입니다. 강조 표시된 막대가 현재 선택된 연도입니다. 연도 선택기로 기준 연도를 변경할 수 있습니다."
                />
            </div>
        </AsyncStateBoundary>
    );
}
