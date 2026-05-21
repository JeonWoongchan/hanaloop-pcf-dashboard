'use client';

// 회사 상세 데이터 패칭 및 차트 레이아웃 구성

import { ErrorState } from '@/components/shared/error-state';
import { YearSelector } from '@/components/shared/year-selector';
import { YearlyComparisonChart } from '@/components/shared/yearly-comparison-chart';
import { Skeleton } from '@/components/ui/skeleton';
import { COUNTRY_FLAGS } from '@/constants/countries';
import { useCompany } from '@/hooks/companies/useCompanies';
import {
    filterByYear,
    getAnnualTotals,
    getAvailableYears,
    getMonthlyByScope,
    getScopeBreakdown,
    getSelectedYear,
    getTotalBySource,
} from '@/lib/emissions';
import { formatEmissions } from '@/lib/format';
import { parseAsInteger, useQueryState } from 'nuqs';
import { useMemo } from 'react';
import { CompanyMonthlyChart } from './company-monthly-chart';
import { CompanyScopeChart } from './company-scope-chart';
import { CompanySourceChart } from './company-source-chart';

// 회사 상세 로딩 중 스켈레톤
function CompanyDetailSkeleton() {
    return (
        <div className="space-y-6">
            <Skeleton className="h-16 w-64 rounded-xl" />
            <Skeleton className="h-[320px] rounded-xl" />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Skeleton className="h-[260px] rounded-xl" />
                <Skeleton className="h-[260px] rounded-xl" />
            </div>
        </div>
    );
}

// 회사 상세 컨텐츠 렌더링
export function CompanyDetailContent({ id }: { id: string }) {
    const { data: company, isLoading, error, refetch } = useCompany(id);
    const [yearParam, setYearParam] = useQueryState('year', parseAsInteger);

    const availableYears = useMemo(
        () => (company ? getAvailableYears(company.emissions) : []),
        [company]
    );
    const selectedYear = getSelectedYear(yearParam, availableYears);

    if (isLoading) return <CompanyDetailSkeleton />;
    if (error || !company) return <ErrorState onRetry={refetch} />;

    const filteredEmissions = filterByYear(company.emissions, selectedYear);
    const annualTotal = Math.round(filteredEmissions.reduce((sum, e) => sum + e.emissions, 0));
    const monthlyByScope = getMonthlyByScope(filteredEmissions);
    const scopes = getScopeBreakdown(filteredEmissions);
    const totalBySource = getTotalBySource(filteredEmissions);
    // 연도 필터 전 전체 데이터로 연도별 비교 차트 생성
    const yearlyTotals = getAnnualTotals(company.emissions);
    const flag = COUNTRY_FLAGS[company.country] ?? '';

    return (
        <div className="space-y-6">
            {/* 회사 헤더 */}
            <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-2xl font-bold tracking-tight">{company.name}</h2>
                        <span className="text-muted-foreground">
                            {flag} {company.country}
                        </span>
                    </div>
                    <p className="text-muted-foreground">
                        {selectedYear}년 연간 총 배출량:{' '}
                        <span className="font-semibold text-foreground">
                            {formatEmissions(annualTotal)} tCO₂e
                        </span>
                    </p>
                </div>
                <YearSelector
                    years={availableYears}
                    value={selectedYear}
                    onChangeAction={(y) => void setYearParam(y)}
                />
            </div>

            {/* 월별 Scope 스택 에어리어 차트 */}
            <CompanyMonthlyChart data={monthlyByScope} year={selectedYear} />

            {/* 연도별 배출량 비교 차트 */}
            <YearlyComparisonChart
                data={yearlyTotals}
                selectedYear={selectedYear}
                title="연도별 배출량 추이"
                description={`${company.name} · 연도별 누적 온실가스 배출량 (tCO₂e)`}
            />

            {/* Scope 비중 + 배출원별 차트 */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <CompanyScopeChart scopes={scopes} totalEmissions={annualTotal} />
                <CompanySourceChart sources={totalBySource} year={selectedYear} />
            </div>
        </div>
    );
}
