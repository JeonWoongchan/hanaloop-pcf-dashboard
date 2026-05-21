'use client';

// 대시보드 홈 데이터 패칭 및 전체 레이아웃 구성

import { ErrorState } from '@/components/shared/error-state';
import { YearSelector } from '@/components/shared/year-selector';
import { YearlyComparisonChart } from '@/components/shared/yearly-comparison-chart';
import { Skeleton } from '@/components/ui/skeleton';
import { useCompanies } from '@/hooks/companies/useCompanies';
import { useDashboardMetrics } from '@/hooks/dashboard/useDashboardMetrics';
import { parseAsInteger, useQueryState } from 'nuqs';
import { CompanyBarChart } from './company-bar-chart';
import { EmissionTrendChart } from './emission-trend-chart';
import { KpiCards } from './kpi-cards';

// 대시보드 레이아웃 전용 로딩 스켈레톤
function DashboardSkeleton() {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-28 rounded-xl" />
                ))}
            </div>
            <Skeleton className="h-92 rounded-xl" />
            <Skeleton className="h-79 rounded-xl" />
        </div>
    );
}

// 대시보드 전체 컨텐츠 렌더링
export function DashboardContent() {
    const { data: companies, isLoading, error, refetch } = useCompanies();
    const [yearParam, setYearParam] = useQueryState('year', parseAsInteger);

    const { selectedYear, availableYears, yearlyTotals, monthlyTotals, momChange, totalByCompany, mergedMonthlyData, improvingCount } =
        useDashboardMetrics(companies ?? [], yearParam);

    if (isLoading) return <DashboardSkeleton />;
    if (error || !companies?.length) return <ErrorState onRetry={refetch} />;

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">대시보드</h2>
                    <p className="text-muted-foreground">{selectedYear}년 온실가스 배출 현황 요약</p>
                </div>
                <YearSelector
                    years={availableYears}
                    value={selectedYear}
                    onChangeAction={(y) => void setYearParam(y)}
                />
            </div>

            <KpiCards
                year={selectedYear}
                monthlyTotals={monthlyTotals}
                momChange={momChange}
                totalByCompany={totalByCompany}
                improvingCount={improvingCount}
                totalCompanies={companies.length}
            />

            <EmissionTrendChart year={selectedYear} data={mergedMonthlyData} companies={companies} />

            <CompanyBarChart year={selectedYear} data={totalByCompany} />

            <YearlyComparisonChart
                data={yearlyTotals}
                selectedYear={selectedYear}
                title="연도별 총 배출량 추이"
                description="전체 회사 합산 · 연도별 누적 온실가스 배출량 (tCO₂e)"
            />
        </div>
    );
}
