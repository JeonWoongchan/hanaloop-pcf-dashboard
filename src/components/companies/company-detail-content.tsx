'use client';

import { ActivityRecordsTable } from '@/components/activity/activity-records-table';
import { CompanyReductionScenario } from '@/components/companies/company-reduction-scenario';
import { CompanyRiskCard } from '@/components/companies/company-risk-card';
import { ExcelImportDialog } from '@/components/import/excel-import-dialog';
import { ActionNotesPanel } from '@/components/posts/action-notes-panel';
import { RiskLevelBadge } from '@/components/risk/risk-level-badge';
import { ErrorState } from '@/components/shared/error-state';
import { ChartSkeleton, ListSkeleton } from '@/components/shared/loading-skeletons';
import { MetricYearlyComparisonChart } from '@/components/shared/metric-yearly-comparison-chart';
import { YearSelector } from '@/components/shared/year-selector';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { COUNTRY_FLAGS } from '@/constants/countries';
import { useActivityRecords } from '@/hooks/activity-records/useActivityRecords';
import { useCompany } from '@/hooks/companies/useCompanies';
import { useCompanyRisk } from '@/hooks/risk/useCompanyRisk';
import {
    filterActivityRecordsByYear,
    filterByYear,
    getAnnualTotals,
    getAvailablePcfYears,
    getAvailableYears,
    getCombinedAvailableYears,
    getMonthlyByScope,
    getPcfAnnualTotals,
    getPcfMonthlyByScope,
    getScopeBreakdown,
    getScopeTotals,
    getSelectedYear,
    getTotalBySource,
    sumEmissions,
    sumPcf,
} from '@/lib/emissions';
import { formatEmissions, formatPcfEmissions } from '@/lib/format';
import type { ActivityRecord, Company } from '@/types';
import { Upload } from 'lucide-react';
import dynamic from 'next/dynamic';
import { parseAsInteger, useQueryState } from 'nuqs';
import { useMemo, useState } from 'react';

const CompanyMonthlyChart = dynamic(
    () => import('./company-monthly-chart').then((m) => ({ default: m.CompanyMonthlyChart })),
    { loading: () => <ChartSkeleton className="h-70" />, ssr: false }
);
const CompanyScopeChart = dynamic(
    () => import('./company-scope-chart').then((m) => ({ default: m.CompanyScopeChart })),
    { loading: () => <ChartSkeleton className="h-65" />, ssr: false }
);
const CompanySourceChart = dynamic(
    () => import('./company-source-chart').then((m) => ({ default: m.CompanySourceChart })),
    { loading: () => <ChartSkeleton className="h-65" />, ssr: false }
);

function CompanyDetailSkeleton() {
    return (
        <div className="space-y-6">
            <Skeleton className="h-16 w-64 rounded-xl" />
            <Skeleton className="h-40 rounded-xl" />
            <ChartSkeleton className="h-70" />
            <ChartSkeleton className="h-50" />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <ChartSkeleton className="h-65" />
                <ChartSkeleton className="h-65" />
            </div>
            <div className="space-y-3">
                <Skeleton className="h-8 w-32 rounded-md" />
                <ListSkeleton />
            </div>
        </div>
    );
}

function getCompanyDetailMetrics(
    company: Company,
    activityRecords: ActivityRecord[],
    selectedYear: number
) {
    const filteredEmissions = filterByYear(company.emissions, selectedYear);
    const filteredActivityRecords = filterActivityRecordsByYear(activityRecords, selectedYear);
    const annualGhgTotal = sumEmissions(filteredEmissions);

    return {
        annualGhgTotal,
        annualPcfTotal: sumPcf(filteredActivityRecords),
        pcfRecordCount: filteredActivityRecords.length,
        monthlyByScope: getMonthlyByScope(filteredEmissions),
        monthlyPcfByScope: getPcfMonthlyByScope(filteredActivityRecords),
        scopes: getScopeBreakdown(filteredEmissions),
        totalBySource: getTotalBySource(filteredEmissions),
        scopeEmissions: getScopeTotals(filteredEmissions),
        yearlyTotals: getAnnualTotals(company.emissions),
        pcfYearlyTotals: getPcfAnnualTotals(activityRecords),
    };
}

export function CompanyDetailContent({ id }: { id: string }) {
    const [importOpen, setImportOpen] = useState(false);
    const { data: company, isLoading, error, refetch } = useCompany(id);
    const {
        data: activityRecords,
        isLoading: isActivityRecordsLoading,
        error: activityRecordsError,
        refetch: refetchActivityRecords,
    } = useActivityRecords(company?.id ?? '');
    const [yearParam, setYearParam] = useQueryState('year', parseAsInteger);

    const availableYears = useMemo(
        () =>
            getCombinedAvailableYears(
                company ? getAvailableYears(company.emissions) : [],
                getAvailablePcfYears(activityRecords ?? [])
            ),
        [activityRecords, company]
    );
    const selectedYear = getSelectedYear(yearParam, availableYears);
    const {
        assessment: riskAssessment,
        rank: riskRank,
        total: riskTotal,
    } = useCompanyRisk(company?.id ?? '', selectedYear);

    if (isLoading || isActivityRecordsLoading) return <CompanyDetailSkeleton />;
    if (error || activityRecordsError) {
        return (
            <ErrorState
                message="회사 상세 데이터와 PCF 활동 데이터를 불러오지 못했습니다."
                onRetry={() => {
                    void refetch();
                    void refetchActivityRecords();
                }}
            />
        );
    }
    if (!company) return <ErrorState message="해당 회사를 찾을 수 없습니다." />;

    const metrics = getCompanyDetailMetrics(company, activityRecords ?? [], selectedYear);
    const flag = COUNTRY_FLAGS[company.country] ?? '';

    return (
        <>
            <ExcelImportDialog
                open={importOpen}
                onOpenChangeAction={setImportOpen}
                defaultCompanyId={company.id}
                fixedCompanyName={company.name}
            />
            <div className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-3">
                            <h2 className="text-2xl font-bold tracking-tight">{company.name}</h2>
                            <span className="text-muted-foreground">
                                {flag} {company.country}
                            </span>
                            {riskAssessment && <RiskLevelBadge level={riskAssessment.level} />}
                        </div>
                        <p className="text-muted-foreground">
                            {selectedYear}년 연간 총 PCF:{' '}
                            <span className="text-foreground font-semibold">
                                {metrics.pcfRecordCount > 0
                                    ? `${formatPcfEmissions(metrics.annualPcfTotal)} kgCO₂e`
                                    : '-'}
                            </span>
                        </p>
                        <p className="text-muted-foreground text-sm">
                            {metrics.pcfRecordCount > 0
                                ? `GHG 집계 배출량 ${formatEmissions(metrics.annualGhgTotal)} tCO₂e`
                                : `${selectedYear}년 PCF 활동 데이터 없음 · GHG 집계 배출량 ${formatEmissions(metrics.annualGhgTotal)} tCO₂e`}
                        </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
                        <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
                            <Upload className="mr-2 h-4 w-4" />
                            Excel 임포트
                        </Button>
                        <YearSelector
                            years={availableYears}
                            value={selectedYear}
                            onChangeAction={(y) => void setYearParam(y)}
                        />
                    </div>
                </div>

                {riskAssessment && (
                    <CompanyRiskCard
                        assessment={riskAssessment}
                        rank={riskRank}
                        total={riskTotal}
                    />
                )}

                <ActivityRecordsTable companyId={company.id} />

                <CompanyMonthlyChart
                    emissionsData={metrics.monthlyByScope}
                    pcfData={metrics.monthlyPcfByScope}
                    year={selectedYear}
                />

                <MetricYearlyComparisonChart
                    emissionsData={metrics.yearlyTotals}
                    pcfData={metrics.pcfYearlyTotals}
                    selectedYear={selectedYear}
                    pcfText={{
                        title: '연도별 PCF 추이',
                        description: `${company.name} · 연도별 원본 활동 데이터 기반 PCF (kgCO₂e)`,
                        helpText:
                            '해당 회사의 연도별 PCF 산정값 추이입니다. 제품 생산량 보정 없이 업로드된 활동 데이터 기준 합산값입니다.',
                        valueLabel: '총 PCF',
                    }}
                    emissionsText={{
                        title: '연도별 배출량 추이',
                        description: `${company.name} · 연도별 누적 온실가스 배출량 (tCO₂e)`,
                        helpText:
                            '해당 회사의 연도별 배출량 추이입니다. 강조 표시된 막대가 현재 선택한 연도입니다.',
                        valueLabel: '총 배출량',
                    }}
                />

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <CompanyScopeChart
                        scopes={metrics.scopes}
                        totalEmissions={metrics.annualGhgTotal}
                    />
                    <CompanySourceChart sources={metrics.totalBySource} year={selectedYear} />
                </div>

                <CompanyReductionScenario
                    scopeEmissions={metrics.scopeEmissions}
                    totalEmissions={metrics.annualGhgTotal}
                    year={selectedYear}
                />

                <ActionNotesPanel companyId={company.id} />
            </div>
        </>
    );
}
