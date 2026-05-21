// 배출원 분석 페이지 집계 훅

import {
    filterByYear,
    getCompanyTotalsForSource,
    getMonthlyTotalsBySource,
    getTotalBySource,
} from '@/lib/emissions';
import type { Company } from '@/types';
import { useMemo } from 'react';

export type SourceItem = { source: string; total: number; scope: 1 | 2 | 3 };

export function useSourceMetrics(
    companies: Company[],
    year: number,
    scopeFilter: string,
    sourceId: string | null
) {
    return useMemo(() => {
        const allEmissions = companies.flatMap((c) => filterByYear(c.emissions, year));
        const allSources = getTotalBySource(allEmissions);

        // Scope 탭 필터 적용
        const filteredSources =
            scopeFilter === 'all'
                ? allSources
                : allSources.filter((s) => String(s.scope) === scopeFilter);

        // 선택 배출원: URL 파라미터 우선, 없으면 필터된 목록의 1위
        const activeSourceId = sourceId ?? filteredSources[0]?.source ?? null;
        const activeSource = allSources.find((s) => s.source === activeSourceId) ?? null;

        // Scope별 합계
        const scopeTotals: Record<1 | 2 | 3, number> = { 1: 0, 2: 0, 3: 0 };
        for (const s of allSources) {
            scopeTotals[s.scope] += s.total;
        }

        // 드릴다운 데이터 — 선택 배출원 기준
        const companyBreakdown = activeSourceId
            ? getCompanyTotalsForSource(companies, activeSourceId, year)
            : [];
        const monthlyTrend = activeSourceId
            ? getMonthlyTotalsBySource(allEmissions, activeSourceId)
            : [];

        const totalEmissions = allSources.reduce((sum, s) => sum + s.total, 0);

        return {
            allSources,
            filteredSources,
            activeSourceId,
            activeSource,
            scopeTotals,
            companyBreakdown,
            monthlyTrend,
            totalEmissions,
        };
    }, [companies, year, scopeFilter, sourceId]);
}
