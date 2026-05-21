// 배출량 데이터 집계 유틸리티 — 순수 함수로 구성하여 단위 테스트 용이

import { SCOPE_MAP } from '@/constants/ghg-scope';
import type { Company, GhgEmission } from '@/types';

export type MonthlyTotal = { month: string; total: number };
export type AnnualTotal = { year: number; total: number };
export type CompanyTotal = { id: string; name: string; country: string; total: number };
export type ScopeBreakdownItem = { scope: 1 | 2 | 3; pct: number };

// 병합 데이터에서 전체 합산 열을 식별하는 키
export const TOTAL_EMISSIONS_KEY = '전체 합산' as const;

// 회사별 연간 총 배출량 집계 (총합 내림차순 정렬)
export function getTotalByCompany(companies: Company[]): CompanyTotal[] {
    return companies
        .map((c) => ({
            id: c.id,
            name: c.name,
            country: c.country,
            total: Math.round(c.emissions.reduce((sum, e) => sum + e.emissions, 0)),
        }))
        .sort((a, b) => b.total - a.total);
}

// 전체 회사 월별 합산 배출량
export function getMonthlyTotals(companies: Company[]): MonthlyTotal[] {
    const map = new Map<string, number>();
    for (const company of companies) {
        for (const e of company.emissions) {
            map.set(e.yearMonth, (map.get(e.yearMonth) ?? 0) + e.emissions);
        }
    }
    return Array.from(map.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, total]) => ({ month, total: Math.round(total) }));
}

// Recharts 라인 차트용 회사별 월별 배출량 (wide format 변환)
export function getMonthlyByCompany(
    companies: Company[]
): Record<string, number | string>[] {
    const months = getUniqueMonths(companies);
    return months.map((month) => {
        const row: Record<string, number | string> = { month };
        for (const company of companies) {
            const total = company.emissions
                .filter((e) => e.yearMonth === month)
                .reduce((sum, e) => sum + e.emissions, 0);
            row[company.name] = Math.round(total);
        }
        return row;
    });
}

// 전월 대비 배출량 변화율 (%)
export function getMonthOverMonthChange(totals: MonthlyTotal[]): number | null {
    if (totals.length < 2) return null;
    const sorted = [...totals].sort((a, b) => a.month.localeCompare(b.month));
    const last = sorted[sorted.length - 1];
    const prev = sorted[sorted.length - 2];
    if (prev.total === 0) return null;
    return ((last.total - prev.total) / prev.total) * 100;
}

// 첫 달 대비 마지막 달 배출량이 감소한 기업 수 집계
export function getImprovingCompanyCount(companies: Company[]): number {
    return companies.filter((company) => {
        const months = getUniqueMonthsForCompany(company.emissions);
        if (months.length < 2) return false;
        const firstTotal = sumByMonth(company.emissions, months[0]);
        const lastTotal = sumByMonth(company.emissions, months[months.length - 1]);
        return lastTotal < firstTotal;
    }).length;
}

// 트렌드 차트용 전체 합산 + 회사별 배출량 병합 데이터 생성
// monthlyByCompany는 호출부에서 미리 계산된 값을 주입받아 이중 계산 방지
export function getMergedMonthlyData(
    monthlyByCompany: Record<string, number | string>[],
    monthlyTotals: MonthlyTotal[]
): Record<string, number | string>[] {
    // 인덱스 기반 정렬 대신 month 키로 매핑하여 순서 불일치 방지
    const totalMap = new Map(monthlyTotals.map((m) => [m.month, m.total]));
    return monthlyByCompany.map((row) => ({
        ...row,
        [TOTAL_EMISSIONS_KEY]: totalMap.get(row.month as string) ?? 0,
    }));
}

function sumByMonth(emissions: GhgEmission[], month: string): number {
    return emissions
        .filter((e) => e.yearMonth === month)
        .reduce((sum, e) => sum + e.emissions, 0);
}

function getUniqueMonthsForCompany(emissions: GhgEmission[]): string[] {
    return [...new Set(emissions.map((e) => e.yearMonth))].sort();
}

function getUniqueMonths(companies: Company[]): string[] {
    const months = new Set<string>();
    for (const company of companies) {
        for (const e of company.emissions) months.add(e.yearMonth);
    }
    return Array.from(months).sort();
}

// 회사 월별 Scope 1/2/3 배출량 (스택 에어리어 차트용 wide format)
export function getMonthlyByScope(
    emissions: GhgEmission[]
): Record<string, number | string>[] {
    const months = [...new Set(emissions.map((e) => e.yearMonth))].sort();
    return months.map((month) => {
        const row: Record<string, number | string> = { month };
        const monthEmissions = emissions.filter((e) => e.yearMonth === month);
        for (const scope of [1, 2, 3] as const) {
            row[`Scope ${scope}`] = Math.round(
                monthEmissions
                    .filter((e) => (SCOPE_MAP[e.source] ?? 3) === scope)
                    .reduce((sum, e) => sum + e.emissions, 0)
            );
        }
        return row;
    });
}

// 배출원별 연간 총 배출량 (Scope 정보 포함, 내림차순 정렬)
export function getTotalBySource(
    emissions: GhgEmission[]
): Array<{ source: string; total: number; scope: 1 | 2 | 3 }> {
    const map = new Map<string, number>();
    for (const e of emissions) {
        map.set(e.source, (map.get(e.source) ?? 0) + e.emissions);
    }
    return Array.from(map.entries())
        .map(([source, total]) => ({
            source,
            total: Math.round(total),
            scope: (SCOPE_MAP[source] ?? 3) as 1 | 2 | 3,
        }))
        .sort((a, b) => b.total - a.total);
}

// 배출량 데이터에 포함된 연도 목록 추출 (내림차순)
export function getAvailableYears(emissions: GhgEmission[]): number[] {
    const years = new Set(emissions.map((e) => parseInt(e.yearMonth.slice(0, 4), 10)));
    return Array.from(years).sort((a, b) => b - a);
}

// 배출량 배열을 연도별로 합산 (전체 회사: flatMap 사용, 단일 회사: 그대로 전달)
export function getAnnualTotals(emissions: GhgEmission[]): AnnualTotal[] {
    const map = new Map<number, number>();
    for (const e of emissions) {
        const year = parseInt(e.yearMonth.slice(0, 4), 10);
        map.set(year, (map.get(year) ?? 0) + e.emissions);
    }
    return Array.from(map.entries())
        .sort(([a], [b]) => a - b)
        .map(([year, total]) => ({ year, total: Math.round(total) }));
}

// URL 파라미터·함수 인자 연도를 사용 가능한 연도 목록과 조합해 최종 연도 반환
export function getSelectedYear(
    yearParam: number | null | undefined,
    availableYears: number[]
): number {
    return yearParam ?? availableYears[0] ?? new Date().getFullYear();
}

// 특정 연도의 배출량만 필터링
export function filterByYear(emissions: GhgEmission[], year: number): GhgEmission[] {
    const prefix = `${year}-`;
    return emissions.filter((e) => e.yearMonth.startsWith(prefix));
}

// 배출량 데이터로 GHG Scope 1/2/3 비중 계산
export function getScopeBreakdown(emissions: GhgEmission[]): ScopeBreakdownItem[] {
    const totals: Record<1 | 2 | 3, number> = { 1: 0, 2: 0, 3: 0 };
    for (const e of emissions) {
        const scope = (SCOPE_MAP[e.source] ?? 3) as 1 | 2 | 3;
        totals[scope] += e.emissions;
    }
    const total = totals[1] + totals[2] + totals[3];
    return ([1, 2, 3] as const).map((scope) => ({
        scope,
        pct: total > 0 ? (totals[scope] / total) * 100 : 0,
    }));
}
