'use client';

// 리스크 관리 페이지 데이터 패칭 및 레이아웃 구성

import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { YearSelector } from '@/components/shared/year-selector';
import { Skeleton } from '@/components/ui/skeleton';
import { useCompanies } from '@/hooks/companies/useCompanies';
import { useRiskMetrics } from '@/hooks/risk/useRiskMetrics';
import { parseAsInteger, useQueryState } from 'nuqs';
import { RiskKpiCards } from './risk-kpi-cards';
import { RiskPriorityTable } from './risk-priority-table';
import { TaxScenarioCard } from './tax-scenario-card';

// 리스크 페이지 로딩 중 스켈레톤
function RiskSkeleton() {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-28 rounded-xl" />
                ))}
            </div>
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-96 rounded-xl" />
        </div>
    );
}

export function RiskContent() {
    const { data: companies, isLoading, error, refetch } = useCompanies();
    const [yearParam, setYearParam] = useQueryState('year', parseAsInteger);

    const { selectedYear, availableYears, assessments, summary } = useRiskMetrics(
        companies ?? [],
        yearParam
    );

    if (isLoading) return <RiskSkeleton />;
    if (error) return <ErrorState onRetry={refetch} />;
    if (!companies?.length) return <EmptyState message="등록된 관리 대상 회사가 없습니다." />;

    return (
        <div className="space-y-6">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">리스크 관리</h2>
                    <p className="text-muted-foreground">
                        관리 대상 회사의 탄소세 노출액과 감축 우선순위를 확인합니다.
                    </p>
                </div>
                <YearSelector
                    years={availableYears}
                    value={selectedYear}
                    onChangeAction={(year) => void setYearParam(year)}
                />
            </div>

            <RiskKpiCards summary={summary} year={selectedYear} totalCompanies={companies.length} />

            <TaxScenarioCard />

            <RiskPriorityTable assessments={assessments} year={selectedYear} />
        </div>
    );
}
