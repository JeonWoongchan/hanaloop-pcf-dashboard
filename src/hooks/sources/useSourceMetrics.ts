// 배출원 분석 페이지 집계 훅

import {
    filterByYear,
    getCompanyTotalsForSource,
    getMonthlyTotalsBySource,
    getScopeTotals,
    getTotalBySource,
} from '@/lib/emissions';
import type { Company } from '@/types';
import { useMemo } from 'react';

export type SourceItem = { source: string; total: number; scope: 1 | 2 | 3 };

export function useSourceMetrics(companies: Company[], year: number, sourceId: string | null) {
    return useMemo(() => {
        const allEmissions = companies.flatMap((c) => filterByYear(c.emissions, year));
        const allSources = getTotalBySource(allEmissions);

        // 선택 배출원: 유효한 URL 파라미터 우선, 없으면 전체 랭킹 1위
        const requestedSource =
            sourceId && allSources.some((s) => s.source === sourceId) ? sourceId : null;
        const activeSourceId = requestedSource ?? allSources[0]?.source ?? null;
        const activeSource = allSources.find((s) => s.source === activeSourceId) ?? null;

        // Scope별 합계 — allEmissions 재사용으로 추가 순회 없음
        const scopeTotals = getScopeTotals(allEmissions);

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
            activeSourceId,
            activeSource,
            scopeTotals,
            companyBreakdown,
            monthlyTrend,
            totalEmissions,
        };
    }, [companies, year, sourceId]);
}
