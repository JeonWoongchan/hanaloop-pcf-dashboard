'use client';

// 배출원 분석 페이지 — 데이터 패칭 및 전체 레이아웃

import { AsyncStateBoundary } from '@/components/shared/async-state-boundary';
import { ReportExportButton } from '@/components/reports/report-export-button';
import { ChartSkeleton } from '@/components/shared/loading-skeletons';
import { Skeleton } from '@/components/ui/skeleton';
import { YearSelector } from '@/components/shared/year-selector';
import {
    SCOPE_COLORS,
    SCOPE_DESCRIPTIONS,
    SCOPE_LABELS,
    SCOPES,
    getScopeSourceColorMap,
} from '@/constants/ghg-scope';
import { useCompanies } from '@/hooks/companies/useCompanies';
import { useSourceMetrics } from '@/hooks/sources/useSourceMetrics';
import { getAvailableYears, getCompanyScatterPoints, getSelectedYear } from '@/lib/emissions';
import { formatEmissions } from '@/lib/format';
import { buildSourcesReportWorkbook } from '@/lib/reports/builders/sources-report';
import dynamic from 'next/dynamic';
import { parseAsInteger, parseAsString, useQueryState } from 'nuqs';
import { useMemo } from 'react';

// recharts 번들을 초기 JS에서 분리하기 위한 동적 임포트
const SourceRankingChart = dynamic(
    () => import('./source-ranking-chart').then((m) => ({ default: m.SourceRankingChart })),
    { loading: () => <ChartSkeleton className="h-80" />, ssr: false }
);
const SourceDrilldown = dynamic(
    () => import('./source-drilldown').then((m) => ({ default: m.SourceDrilldown })),
    { loading: () => <ChartSkeleton className="h-75" />, ssr: false }
);
const ScopeScatterCharts = dynamic(
    () => import('./scope-scatter-charts').then((m) => ({ default: m.ScopeScatterCharts })),
    { loading: () => <ChartSkeleton className="h-60" />, ssr: false }
);

// 배출원 분석 로딩 스켈레톤
function SourcesSkeleton() {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-24 rounded-xl" />
                ))}
            </div>
            <ChartSkeleton className="h-80" />
            <ChartSkeleton className="h-75" />
            <ChartSkeleton className="h-60" />
        </div>
    );
}

// 배출원 분석 전체 컨텐츠 렌더링
export function SourcesContent() {
    const { data: companies, isLoading, error, refetch } = useCompanies();
    const [yearParam, setYearParam] = useQueryState('year', parseAsInteger);
    const [sourceParam, setSourceParam] = useQueryState('source', parseAsString);

    const availableYears = useMemo(
        () => (companies ? getAvailableYears(companies.flatMap((c) => c.emissions)) : []),
        [companies]
    );
    const selectedYear = getSelectedYear(yearParam, availableYears);

    const {
        allSources,
        activeSourceId,
        activeSource,
        scopeTotals,
        companyBreakdown,
        monthlyTrend,
        totalEmissions,
    } = useSourceMetrics(companies ?? [], selectedYear, sourceParam);

    // 배출원별 색상 맵 단일 산정
    const sourceColorMap = useMemo(() => getScopeSourceColorMap(allSources), [allSources]);
    const activeSourceColor = activeSource
        ? (sourceColorMap[activeSource.source] ?? SCOPE_COLORS[activeSource.scope])
        : null;

    const scatterData = useMemo(
        () => getCompanyScatterPoints(companies ?? [], selectedYear),
        [companies, selectedYear]
    );

    return (
        <AsyncStateBoundary
            isLoading={isLoading}
            error={error}
            isEmpty={!companies?.length}
            loadingFallback={<SourcesSkeleton />}
            emptyMessage="등록된 관리 대상 회사가 없습니다."
            onRetry={refetch}
        >
            <div className="space-y-6">
                {/* 페이지 헤더 */}
                <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">배출원 분석</h2>
                        <p className="text-muted-foreground">
                            {selectedYear}년 관리 대상 전체 · 배출원별 현황 및 Scope 분포 분석
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <ReportExportButton
                            buildReportAction={() =>
                                buildSourcesReportWorkbook({
                                    year: selectedYear,
                                    allSources,
                                    activeSource,
                                    scopeTotals,
                                    companyBreakdown,
                                    monthlyTrend,
                                    totalEmissions,
                                    totalCompanies: companies?.length ?? 0,
                                })
                            }
                            fileName={`sources-report-${selectedYear}-${activeSourceId ?? 'all'}`}
                        />
                        <YearSelector
                            years={availableYears}
                            value={selectedYear}
                            onChangeAction={(y) => void setYearParam(y)}
                        />
                    </div>
                </div>

                {/* Scope별 요약 카드 */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {SCOPES.map((scope) => (
                        <div
                            key={scope}
                            className="bg-card space-y-1 rounded-xl border p-4"
                            style={{ borderLeftWidth: 3, borderLeftColor: SCOPE_COLORS[scope] }}
                        >
                            <p
                                className="text-xs font-medium"
                                style={{ color: SCOPE_COLORS[scope] }}
                            >
                                {SCOPE_LABELS[scope]}
                            </p>
                            <p className="text-2xl font-bold">
                                {formatEmissions(scopeTotals[scope])}
                            </p>
                            <p className="text-muted-foreground text-xs">
                                tCO₂e · {SCOPE_DESCRIPTIONS[scope]}
                            </p>
                        </div>
                    ))}
                </div>

                {/* 배출원 랭킹 차트 */}
                <SourceRankingChart
                    allSources={allSources}
                    activeSourceId={activeSourceId}
                    sourceColorMap={sourceColorMap}
                    onSourceSelectAction={(s) => void setSourceParam(s)}
                    year={selectedYear}
                />

                {/* 선택 배출원 드릴다운 */}
                {activeSource && (
                    <SourceDrilldown
                        sourceId={activeSource.source}
                        scope={activeSource.scope}
                        color={activeSourceColor ?? SCOPE_COLORS[activeSource.scope]}
                        companyBreakdown={companyBreakdown}
                        monthlyTrend={monthlyTrend}
                        year={selectedYear}
                    />
                )}

                {/* Scope 구성 산포도 */}
                <ScopeScatterCharts data={scatterData} year={selectedYear} />
            </div>
        </AsyncStateBoundary>
    );
}
