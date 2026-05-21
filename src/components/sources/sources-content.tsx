'use client';

// 배출원 분석 페이지 — 데이터 패칭 및 전체 레이아웃

import { ErrorState } from '@/components/shared/error-state';
import { YearSelector } from '@/components/shared/year-selector';
import { Skeleton } from '@/components/ui/skeleton';
import { SCOPE_COLORS, SCOPE_DESCRIPTIONS, SCOPE_LABELS } from '@/constants/ghg-scope';
import { useCompanies } from '@/hooks/companies/useCompanies';
import { useSourceMetrics } from '@/hooks/sources/useSourceMetrics';
import { getAvailableYears, getSelectedYear } from '@/lib/emissions';
import { formatEmissions } from '@/lib/format';
import { parseAsInteger, parseAsString, parseAsStringLiteral, useQueryState } from 'nuqs';
import { useMemo } from 'react';
import { ReductionScenarioCard } from './reduction-scenario-card';
import { SourceDrilldown } from './source-drilldown';
import { SourceRankingChart } from './source-ranking-chart';

const scopeParser = parseAsStringLiteral(['all', '1', '2', '3'] as const).withDefault('all');

// 배출원 분석 로딩 스켈레톤
function SourcesSkeleton() {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
            </div>
            <Skeleton className="h-80 rounded-xl" />
            <Skeleton className="h-75 rounded-xl" />
            <Skeleton className="h-60 rounded-xl" />
        </div>
    );
}

// 배출원 분석 전체 컨텐츠 렌더링
export function SourcesContent() {
    const { data: companies, isLoading, error, refetch } = useCompanies();
    const [yearParam, setYearParam] = useQueryState('year', parseAsInteger);
    const [scopeFilter, setScopeFilter] = useQueryState('scope', scopeParser);
    const [sourceParam, setSourceParam] = useQueryState('source', parseAsString);

    const availableYears = useMemo(
        () => (companies ? getAvailableYears(companies.flatMap((c) => c.emissions)) : []),
        [companies]
    );
    const selectedYear = getSelectedYear(yearParam, availableYears);

    const {
        filteredSources,
        activeSourceId,
        activeSource,
        scopeTotals,
        companyBreakdown,
        monthlyTrend,
        totalEmissions,
    } = useSourceMetrics(companies ?? [], selectedYear, scopeFilter, sourceParam);

    if (isLoading) return <SourcesSkeleton />;
    if (error || !companies?.length) return <ErrorState onRetry={refetch} />;

    return (
        <div className="space-y-6">
            {/* 페이지 헤더 */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">배출원 분석</h2>
                    <p className="text-muted-foreground">
                        {selectedYear}년 관리 대상 전체 · 배출원별 현황 및 감축 시나리오
                    </p>
                </div>
                <YearSelector
                    years={availableYears}
                    value={selectedYear}
                    onChangeAction={(y) => void setYearParam(y)}
                />
            </div>

            {/* Scope별 요약 카드 */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {([1, 2, 3] as const).map((scope) => (
                    <div
                        key={scope}
                        className="rounded-xl border bg-card p-4 space-y-1"
                        style={{ borderLeftWidth: 3, borderLeftColor: SCOPE_COLORS[scope] }}
                    >
                        <p className="text-xs font-medium" style={{ color: SCOPE_COLORS[scope] }}>
                            {SCOPE_LABELS[scope]}
                        </p>
                        <p className="text-2xl font-bold">{formatEmissions(scopeTotals[scope])}</p>
                        <p className="text-xs text-muted-foreground">
                            tCO₂e · {SCOPE_DESCRIPTIONS[scope]}
                        </p>
                    </div>
                ))}
            </div>

            {/* 배출원 랭킹 차트 */}
            <SourceRankingChart
                sources={filteredSources}
                activeSourceId={activeSourceId}
                scopeFilter={scopeFilter}
                onScopeChangeAction={(s) => void setScopeFilter(s as 'all' | '1' | '2' | '3')}
                onSourceSelectAction={(s) => void setSourceParam(s)}
                year={selectedYear}
            />

            {/* 선택 배출원 드릴다운 */}
            {activeSource && (
                <SourceDrilldown
                    sourceId={activeSource.source}
                    scope={activeSource.scope}
                    companyBreakdown={companyBreakdown}
                    monthlyTrend={monthlyTrend}
                    year={selectedYear}
                />
            )}

            {/* 감축 시나리오 */}
            {activeSource && (
                <ReductionScenarioCard
                    sourceId={activeSource.source}
                    scope={activeSource.scope}
                    sourceTotal={activeSource.total}
                    totalEmissions={totalEmissions}
                />
            )}
        </div>
    );
}
