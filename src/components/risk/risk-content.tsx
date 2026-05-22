'use client';

// 리스크 관리 페이지 데이터 상태와 레이아웃 구성

import { AsyncStateBoundary } from '@/components/shared/async-state-boundary';
import { ChartSkeleton, MetricGridSkeleton } from '@/components/shared/loading-skeletons';
import { YearSelector } from '@/components/shared/year-selector';
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
            <MetricGridSkeleton />
            <ChartSkeleton className="h-32" />
            <ChartSkeleton className="h-96" />
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

    return (
        <AsyncStateBoundary
            isLoading={isLoading}
            error={error}
            isEmpty={!companies?.length}
            loadingFallback={<RiskSkeleton />}
            emptyMessage="등록된 관리 대상 회사가 없습니다."
            onRetry={refetch}
        >
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

                <RiskKpiCards
                    summary={summary}
                    year={selectedYear}
                    totalCompanies={companies?.length ?? 0}
                />

                <TaxScenarioCard />

                <RiskPriorityTable assessments={assessments} year={selectedYear} />
            </div>
        </AsyncStateBoundary>
    );
}
