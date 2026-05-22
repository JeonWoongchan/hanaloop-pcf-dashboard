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
    getScopeTotals,
    getTotalBySource,
    sumEmissions,
} from '@/lib/emissions';
import { formatEmissions } from '@/lib/format';
import { parseAsInteger, useQueryState } from 'nuqs';
import { useMemo } from 'react';
import { CompanyMonthlyChart } from './company-monthly-chart';
import { CompanyRiskCard } from './company-risk-card';
import { CompanyScopeChart } from './company-scope-chart';
import { CompanySourceChart } from './company-source-chart';
import { CompanyPosts } from '@/components/posts/company-posts';
import { RiskLevelBadge } from '@/components/risk/risk-level-badge';
import { useCompanyRisk } from '@/hooks/risk/useCompanyRisk';
import { CompanyReductionScenario } from './company-reduction-scenario';

// 회사 상세 로딩 중 스켈레톤
function CompanyDetailSkeleton() {
    return (
        <div className="space-y-6">
            <Skeleton className="h-16 w-64 rounded-xl" />
            <Skeleton className="h-[160px] rounded-xl" />
            <Skeleton className="h-[280px] rounded-xl" />
            <Skeleton className="h-[200px] rounded-xl" />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Skeleton className="h-[260px] rounded-xl" />
                <Skeleton className="h-[260px] rounded-xl" />
            </div>
            <div className="space-y-3">
                <Skeleton className="h-8 w-32 rounded-md" />
                {[1, 2].map((i) => (
                    <Skeleton key={i} className="h-24 rounded-lg" />
                ))}
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
    // Rules of Hooks: 조건부 반환 전에 호출 — company 미로드 시 null 반환
    const { assessment: riskAssessment, rank: riskRank, total: riskTotal } = useCompanyRisk(company?.id ?? '', selectedYear);

    if (isLoading) return <CompanyDetailSkeleton />;
    if (error || !company) return <ErrorState onRetry={refetch} />;

    const filteredEmissions = filterByYear(company.emissions, selectedYear);
    const annualTotal = sumEmissions(filteredEmissions);
    const monthlyByScope = getMonthlyByScope(filteredEmissions);
    const scopes = getScopeBreakdown(filteredEmissions);
    const totalBySource = getTotalBySource(filteredEmissions);
    const scopeEmissions = getScopeTotals(filteredEmissions);
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
                        {riskAssessment && <RiskLevelBadge level={riskAssessment.level} />}
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

            {/* 리스크 분석 카드 — 등급·노출액·추세·사유 통합 */}
            {riskAssessment && (
                <CompanyRiskCard assessment={riskAssessment} rank={riskRank} total={riskTotal} />
            )}

            {/* Scope별 감축 시나리오 */}
            <CompanyReductionScenario
                scopeEmissions={scopeEmissions}
                totalEmissions={annualTotal}
                year={selectedYear}
            />

            {/* 월별 Scope 스택 에어리어 차트 */}
            <CompanyMonthlyChart data={monthlyByScope} year={selectedYear} />

            {/* 연도별 배출량 비교 차트 */}
            <YearlyComparisonChart
                data={yearlyTotals}
                selectedYear={selectedYear}
                title="연도별 배출량 추이"
                description={`${company.name} · 연도별 누적 온실가스 배출량 (tCO₂e)`}
                helpText="해당 기업의 연도별 배출량 추이를 막대 그래프로 표시합니다. 강조 표시된 막대가 현재 선택된 연도이며, 상단 연도 선택기로 변경할 수 있습니다."
            />

            {/* Scope 비중 + 배출원별 차트 */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <CompanyScopeChart scopes={scopes} totalEmissions={annualTotal} />
                <CompanySourceChart sources={totalBySource} year={selectedYear} />
            </div>

            {/* 포스트 목록 및 CRUD */}
            <CompanyPosts companyId={company.id} />
        </div>
    );
}
