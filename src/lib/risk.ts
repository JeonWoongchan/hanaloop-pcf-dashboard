// 배출권 구매비용과 관리 우선순위 산정 유틸리티

import {
    ALLOWANCE_PRICE_KRW_PER_TCO2E,
    HIGH_EMISSION_SCORE_RATIO,
    HIGH_SCOPE_SHARE_PCT,
    MEDIUM_SCOPE_SHARE_PCT,
    RECENT_TREND_MONTH_COUNT,
    RISK_LEVEL_THRESHOLDS,
    RISK_SCORE_WEIGHTS,
    SCOPE1_SCORE_MULTIPLIER,
    SCOPE2_SCORE_MULTIPLIER,
    SCOPE3_SCORE_MULTIPLIER,
    TREND_SCORE_CAP_PCT,
} from '@/constants/risk';
import { SCOPE_DESCRIPTIONS } from '@/constants/ghg-scope';
import type { Company, GhgEmission } from '@/types';
import { filterByYear, getScopeBreakdown } from './emissions';

export type RiskLevel = 'high' | 'medium' | 'low';

export type RiskAssessment = {
    id: string;
    name: string;
    country: string;
    annualEmissions: number;
    estimatedAllowanceCostKrw: number;
    recentTrendPct: number | null;
    dominantScope: 1 | 2 | 3 | null;
    dominantScopePct: number;
    score: number;
    level: RiskLevel;
    reasons: string[];
};

export type RiskSummary = {
    totalAllowanceCostKrw: number;
    highRiskCount: number;
    averageScore: number;
    increasingCompaniesCount: number;
    improvingCount: number;
};

type MonthlyTotal = {
    month: string;
    total: number;
};

type RiskReasonInput = {
    annualEmissions: number;
    emissionScore: number;
    trendScore: number;
    recentTrendPct: number | null;
    scopeBreakdown: Array<{ scope: 1 | 2 | 3; pct: number }>;
    dominantScope: 1 | 2 | 3 | null;
    dominantScopePct: number;
};

type RiskReasonRule = {
    matches: () => boolean;
    message: () => string;
};

// 회사별 리스크 산정 결과 생성
export function getRiskAssessments(
    companies: Company[],
    year: number,
    allowancePrice = ALLOWANCE_PRICE_KRW_PER_TCO2E
): RiskAssessment[] {
    // 상대 배출량 점수 산정을 위한 최대 배출량 기준값
    const annualTotals = companies.map((company) =>
        sumEmissions(filterByYear(company.emissions, year))
    );
    const maxAnnualEmissions = Math.max(...annualTotals, 0);

    // 회사별 리스크 산정 및 점수 우선순위 정렬
    return companies
        .map((company) => {
            const emissions = filterByYear(company.emissions, year);
            // 선택 연도 이후의 데이터가 과거 연도 리스크에 섞이지 않도록 기준 연도 말일까지 사용
            const trendEmissions = company.emissions.filter(
                (emission) => emission.yearMonth <= `${year}-12`
            );
            // 추세 계산은 기준 연도 이전 범위에서 연도 경계를 넘어 최근 N개월을 사용
            return assessCompanyRisk(
                company,
                emissions,
                trendEmissions,
                maxAnnualEmissions,
                allowancePrice
            );
        })
        .sort((a, b) => b.score - a.score || b.annualEmissions - a.annualEmissions);
}

// 리스크 KPI 요약 생성
export function getRiskSummary(assessments: RiskAssessment[]): RiskSummary {
    if (assessments.length === 0) {
        return {
            totalAllowanceCostKrw: 0,
            highRiskCount: 0,
            averageScore: 0,
            increasingCompaniesCount: 0,
            improvingCount: 0,
        };
    }

    // 전체 리스크 현황 요약값 집계
    const totalScore = assessments.reduce((sum, item) => sum + item.score, 0);
    return {
        totalAllowanceCostKrw: assessments.reduce((sum, item) => sum + item.estimatedAllowanceCostKrw, 0),
        highRiskCount: assessments.filter((item) => item.level === 'high').length,
        averageScore: Math.round(totalScore / assessments.length),
        increasingCompaniesCount: assessments.filter(
            (item) => item.recentTrendPct !== null && item.recentTrendPct > 0
        ).length,
        improvingCount: assessments.filter(
            (item) => item.recentTrendPct !== null && item.recentTrendPct < 0
        ).length,
    };
}

// 개별 회사 리스크 산정
function assessCompanyRisk(
    company: Company,
    emissions: GhgEmission[], // 선택 연도 배출량 — 연간·Scope 계산용
    allEmissions: GhgEmission[], // 전체 배출량 — 연도 경계를 넘는 추세 계산용
    maxAnnualEmissions: number,
    allowancePrice: number
): RiskAssessment {
    // 선택 연도 연간 배출량 합산
    const annualEmissions = Math.round(sumEmissions(emissions));
    // Scope별 비중 및 주요 Scope 산정
    const scopeBreakdown = getScopeBreakdown(emissions);
    const dominantScopeItem = scopeBreakdown.reduce<(typeof scopeBreakdown)[number] | undefined>(
        (current, item) => (!current || item.pct > current.pct ? item : current),
        undefined
    );
    const dominantScope =
        dominantScopeItem && dominantScopeItem.pct > 0 ? dominantScopeItem.scope : null;
    const dominantScopePct = dominantScopeItem ? dominantScopeItem.pct : 0;
    // 최근 N개월 추세 — 연도 경계를 넘어 계산하도록 전체 데이터 사용
    const recentTrendPct = getRecentTrendPct(getMonthlyTotals(allEmissions));

    // 배출량·추세·Scope 구성 점수 합산
    const emissionScore = getEmissionScore(annualEmissions, maxAnnualEmissions);
    const trendScore = getTrendScore(recentTrendPct);
    const scopeScore = getScopeScore(scopeBreakdown);
    const score = Math.round(emissionScore + trendScore + scopeScore);
    const level = getRiskLevel(score);

    return {
        id: company.id,
        name: company.name,
        country: company.country,
        annualEmissions,
        estimatedAllowanceCostKrw: Math.round(annualEmissions * allowancePrice),
        recentTrendPct,
        dominantScope,
        dominantScopePct,
        score,
        level,
        reasons: getRiskReasons({
            annualEmissions,
            emissionScore,
            trendScore,
            recentTrendPct,
            scopeBreakdown,
            dominantScope,
            dominantScopePct,
        }),
    };
}

// 상대 연간 배출량 점수 산정
function getEmissionScore(annualEmissions: number, maxAnnualEmissions: number): number {
    if (maxAnnualEmissions <= 0) return 0;
    return (annualEmissions / maxAnnualEmissions) * RISK_SCORE_WEIGHTS.emissions;
}

// 최근 증가 추세 점수 산정
function getTrendScore(recentTrendPct: number | null): number {
    if (recentTrendPct === null || recentTrendPct <= 0) return 0;
    const capped = Math.min(recentTrendPct, TREND_SCORE_CAP_PCT);
    return (capped / TREND_SCORE_CAP_PCT) * RISK_SCORE_WEIGHTS.trend;
}

// Scope 구성 리스크 점수 산정
function getScopeScore(scopeBreakdown: Array<{ scope: 1 | 2 | 3; pct: number }>): number {
    const scope3Pct = scopeBreakdown.find((item) => item.scope === 3)?.pct ?? 0;
    const scope2Pct = scopeBreakdown.find((item) => item.scope === 2)?.pct ?? 0;
    const scope1Pct = scopeBreakdown.find((item) => item.scope === 1)?.pct ?? 0;

    if (scope3Pct >= HIGH_SCOPE_SHARE_PCT)
        return RISK_SCORE_WEIGHTS.scope * SCOPE3_SCORE_MULTIPLIER;
    if (scope2Pct >= HIGH_SCOPE_SHARE_PCT)
        return RISK_SCORE_WEIGHTS.scope * SCOPE2_SCORE_MULTIPLIER;
    if (scope1Pct >= HIGH_SCOPE_SHARE_PCT)
        return RISK_SCORE_WEIGHTS.scope * SCOPE1_SCORE_MULTIPLIER;

    return (Math.max(scope1Pct, scope2Pct, scope3Pct) / 100) * RISK_SCORE_WEIGHTS.scope;
}

// 점수 기준 리스크 등급 산정
function getRiskLevel(score: number): RiskLevel {
    if (score >= RISK_LEVEL_THRESHOLDS.high) return 'high';
    if (score >= RISK_LEVEL_THRESHOLDS.medium) return 'medium';
    return 'low';
}

// 리스크 등급 사유 문장 생성
function getRiskReasons(input: RiskReasonInput): string[] {
    const {
        annualEmissions,
        emissionScore,
        trendScore,
        recentTrendPct,
        scopeBreakdown,
        dominantScope,
        dominantScopePct,
    } = input;
    const scope3Pct = scopeBreakdown.find((item) => item.scope === 3)?.pct ?? 0;
    const scope2Pct = scopeBreakdown.find((item) => item.scope === 2)?.pct ?? 0;

    if (annualEmissions === 0) {
        return ['선택 연도에 집계된 배출량이 없습니다.'];
    }

    // 조건별 사유 규칙 목록 구성
    const rules: RiskReasonRule[] = [
        {
            matches: () =>
                emissionScore >= RISK_SCORE_WEIGHTS.emissions * HIGH_EMISSION_SCORE_RATIO,
            message: () => '연간 배출량이 관리 대상 중 상위권입니다.',
        },
        {
            matches: () => recentTrendPct !== null && recentTrendPct > 0 && trendScore > 0,
            message: () =>
                `최근 ${RECENT_TREND_MONTH_COUNT}개월 평균 배출량이 이전 기간 대비 ${recentTrendPct?.toFixed(1)}% 증가했습니다.`,
        },
        {
            matches: () => recentTrendPct !== null && recentTrendPct < -5,
            message: () =>
                `최근 ${RECENT_TREND_MONTH_COUNT}개월 평균 배출량은 이전 기간 대비 ${Math.abs(recentTrendPct ?? 0).toFixed(1)}% 감소했습니다.`,
        },
        ...getScopeReasonRules({ scope3Pct, scope2Pct, dominantScope, dominantScopePct }),
    ];

    // 매칭된 규칙 기반 사유 문장 추출
    const reasons = rules.filter((rule) => rule.matches()).map((rule) => rule.message());

    return reasons.length > 0
        ? reasons.slice(0, 3)
        : ['현재 기준 리스크는 상대적으로 낮지만 정기 모니터링이 필요합니다.'];
}

// Scope 구성 기반 사유 규칙 생성
function getScopeReasonRules({
    scope3Pct,
    scope2Pct,
    dominantScope,
    dominantScopePct,
}: {
    scope3Pct: number;
    scope2Pct: number;
    dominantScope: 1 | 2 | 3 | null;
    dominantScopePct: number;
}): RiskReasonRule[] {
    if (scope3Pct >= HIGH_SCOPE_SHARE_PCT) {
        return [
            {
                matches: () => true,
                message: () => 'Scope 3 비중이 높아 공급망·운송 관리 난이도가 큽니다.',
            },
        ];
    }

    if (scope2Pct >= HIGH_SCOPE_SHARE_PCT) {
        return [
            {
                matches: () => true,
                message: () => 'Scope 2 비중이 높아 전력 사용과 재생에너지 전환 검토가 필요합니다.',
            },
        ];
    }

    return [
        {
            matches: () => Boolean(dominantScope) && dominantScopePct >= MEDIUM_SCOPE_SHARE_PCT,
            message: () =>
                `${SCOPE_DESCRIPTIONS[dominantScope as 1 | 2 | 3]} 비중이 ${dominantScopePct.toFixed(1)}%로 가장 큽니다.`,
        },
    ];
}

// 최근 N개월 평균과 직전 N개월 평균의 변화율 계산
function getRecentTrendPct(monthlyTotals: MonthlyTotal[]): number | null {
    if (monthlyTotals.length < RECENT_TREND_MONTH_COUNT * 2) return null;

    const recent = monthlyTotals.slice(-RECENT_TREND_MONTH_COUNT);
    const previous = monthlyTotals.slice(-RECENT_TREND_MONTH_COUNT * 2, -RECENT_TREND_MONTH_COUNT);
    const previousAverage = average(previous.map((item) => item.total));
    if (previousAverage === 0) return null;

    const recentAverage = average(recent.map((item) => item.total));
    return ((recentAverage - previousAverage) / previousAverage) * 100;
}

// 월별 배출량 합산 목록 생성
function getMonthlyTotals(emissions: GhgEmission[]): MonthlyTotal[] {
    const map = new Map<string, number>();
    for (const emission of emissions) {
        map.set(emission.yearMonth, (map.get(emission.yearMonth) ?? 0) + emission.emissions);
    }
    return Array.from(map.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, total]) => ({ month, total }));
}

// 배출량 배열 총합 산정
function sumEmissions(emissions: GhgEmission[]): number {
    return emissions.reduce((sum, emission) => sum + emission.emissions, 0);
}

// 숫자 배열 평균 산정
function average(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
}
