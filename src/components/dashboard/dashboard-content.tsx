'use client';

// 대시보드 홈 데이터 패칭 및 전체 레이아웃 구성

import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/shared/error-state';
import { useCompanies } from '@/hooks/useCompanies';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
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
    const { monthlyTotals, momChange, totalByCompany, monthlyByCompany, improvingCount } =
        useDashboardMetrics(companies ?? []);

    if (isLoading) return <DashboardSkeleton />;
    if (error || !companies?.length) return <ErrorState onRetry={refetch} />;


    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">대시보드</h2>
                <p className="text-muted-foreground">2024년 온실가스 배출 현황 요약</p>
            </div>

            <KpiCards
                monthlyTotals={monthlyTotals}
                momChange={momChange}
                totalByCompany={totalByCompany}
                improvingCount={improvingCount}
                totalCompanies={companies.length}
            />

            <EmissionTrendChart data={monthlyByCompany} companies={companies} />

            <CompanyBarChart data={totalByCompany} />
        </div>
    );
}
