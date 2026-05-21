// 배출량 데이터 집계 유틸리티 — 순수 함수로 구성하여 단위 테스트 용이

import type { Company, GhgEmission } from '@/types';

export type MonthlyTotal = { month: string; total: number };
export type CompanyTotal = { id: string; name: string; country: string; total: number };

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
