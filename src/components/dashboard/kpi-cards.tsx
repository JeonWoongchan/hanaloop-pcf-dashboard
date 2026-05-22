import { CardHeading } from '@/components/shared/card-heading';
import { ChartSkeleton } from '@/components/shared/loading-skeletons';
import { MetricCard } from '@/components/shared/metric-card';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SCOPES } from '@/constants/ghg-scope';
import { ROUTES } from '@/constants/navigation';
import type {
    DashboardEmissionsSummary,
    DashboardPcfSummary,
} from '@/hooks/dashboard/useDashboardMetrics';
import {
    formatEmissions,
    formatKrw,
    formatPcfEmissions,
    formatYearMonth,
    getTrendProps,
    GHG_EMISSIONS_UNIT,
    PCF_EMISSIONS_UNIT,
} from '@/lib/format';
import type { RiskSummary } from '@/lib/risk';
import { Banknote } from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useState } from 'react';

const ScopeDonutChart = dynamic(
    () =>
        import('@/components/shared/scope-donut-chart').then((m) => ({
            default: m.ScopeDonutChart,
        })),
    { loading: () => <ChartSkeleton className="h-36 rounded-lg" />, ssr: false }
);

type KpiMode = 'pcf' | 'emissions';
type DashboardMetricSummary = DashboardPcfSummary | DashboardEmissionsSummary;

const KPI_MODE_CONFIG = {
    pcf: {
        annualTitle: '연간 총 PCF',
        monthlyTitle: '최근 월 PCF',
        annualTooltip:
            '선택한 연도에 업로드된 원본 활동 데이터의 PCF 산정 배출량 합산입니다. 변화율은 전년 같은 기간 대비 증감률입니다.',
        monthlyTooltip:
            '선택한 연도에 업로드된 원본 활동 데이터 중 마지막 월의 PCF 산정 배출량입니다. 변화율은 전년 동월 대비 증감률입니다.',
        noDataLabel: 'PCF 데이터 없음',
        annualBaseLabel: '활동 데이터 기준',
        unit: PCF_EMISSIONS_UNIT,
        formatValue: formatPcfEmissions,
    },
    emissions: {
        annualTitle: '연간 총 배출량',
        monthlyTitle: '최근 월 배출량',
        annualTooltip:
            '선택한 연도에 등록된 관리 대상 회사의 월별 GHG 배출량 합산입니다. 변화율은 전년 같은 기간 대비 증감률입니다.',
        monthlyTooltip:
            '선택한 연도에 등록된 관리 대상 회사의 마지막 월 GHG 배출량입니다. 변화율은 전년 동월 대비 증감률입니다.',
        noDataLabel: '배출량 데이터 없음',
        annualBaseLabel: 'GHG 배출 데이터 기준',
        unit: GHG_EMISSIONS_UNIT,
        formatValue: formatEmissions,
    },
} satisfies Record<
    KpiMode,
    {
        annualTitle: string;
        monthlyTitle: string;
        annualTooltip: string;
        monthlyTooltip: string;
        noDataLabel: string;
        annualBaseLabel: string;
        unit: string;
        formatValue: (value: number) => string;
    }
>;

function MetricValue({
    value,
    unit,
    formatValue,
}: {
    value: number;
    unit: string;
    formatValue: (value: number) => string;
}) {
    return (
        <>
            {formatValue(value)}
            <span className="text-muted-foreground ml-1 text-sm font-normal">{unit}</span>
        </>
    );
}

function AnnualMetricCard({
    mode,
    summary,
    year,
}: {
    mode: KpiMode;
    summary: DashboardMetricSummary;
    year: number;
}) {
    const config = KPI_MODE_CONFIG[mode];
    const hasRecords = summary.recordCount > 0;
    const trend = getTrendProps(summary.yoyChange);

    return (
        <MetricCard
            title={config.annualTitle}
            tooltip={config.annualTooltip}
            value={
                hasRecords ? (
                    <MetricValue
                        value={summary.annualTotal}
                        unit={config.unit}
                        formatValue={config.formatValue}
                    />
                ) : (
                    '-'
                )
            }
            helper={
                !hasRecords
                    ? `${year}년 ${config.noDataLabel}`
                    : summary.yoyChange !== null
                      ? `${trend.label} 전년 같은 기간 대비`
                      : `${year}년 ${config.annualBaseLabel}`
            }
            icon={hasRecords && summary.yoyChange !== null ? trend.Icon : undefined}
            helperClassName={
                hasRecords && summary.yoyChange !== null ? trend.className : 'text-muted-foreground'
            }
        />
    );
}

function MonthlyMetricCard({
    mode,
    summary,
    year,
}: {
    mode: KpiMode;
    summary: DashboardMetricSummary;
    year: number;
}) {
    const config = KPI_MODE_CONFIG[mode];
    const trend = getTrendProps(summary.momYoyChange);

    return (
        <MetricCard
            title={config.monthlyTitle}
            tooltip={config.monthlyTooltip}
            value={
                summary.latestMonth ? (
                    <MetricValue
                        value={summary.latestMonth.total}
                        unit={config.unit}
                        formatValue={config.formatValue}
                    />
                ) : (
                    '-'
                )
            }
            helper={
                summary.latestMonth
                    ? summary.momYoyChange !== null
                        ? `${trend.label} 전년 동월 대비 · ${formatYearMonth(summary.latestMonth.month)}`
                        : formatYearMonth(summary.latestMonth.month)
                    : `${year}년 ${config.noDataLabel}`
            }
            icon={summary.momYoyChange !== null ? trend.Icon : undefined}
            helperClassName={
                summary.momYoyChange !== null ? trend.className : 'text-muted-foreground'
            }
        />
    );
}

function ScopeBreakdownCard({ scopeTotals }: { scopeTotals: Record<1 | 2 | 3, number> }) {
    const total = scopeTotals[1] + scopeTotals[2] + scopeTotals[3];
    const pct = (scope: 1 | 2 | 3) => (total > 0 ? (scopeTotals[scope] / total) * 100 : 0);
    const scopeBarItems = SCOPES.map((scope) => ({ scope, pct: pct(scope) }));

    return (
        <Link href={ROUTES.sources} className="block">
            <Card className="cursor-pointer gap-0 transition-shadow hover:shadow-md">
                <CardHeading
                    title="Scope별 배출 구성"
                    tooltip="관리 대상 전체의 Scope 1, Scope 2, Scope 3 배출 비율입니다. 배출원 분석 페이지에서 배출원별 상세 현황을 확인할 수 있습니다."
                    className="pb-2"
                    titleClassName="text-sm font-medium text-muted-foreground"
                />
                <ScopeDonutChart scopes={scopeBarItems} />
            </Card>
        </Link>
    );
}

function TaxExposureCard({ summary }: { summary: RiskSummary }) {
    return (
        <MetricCard
            title="탄소세 예상 노출액"
            tooltip="가정 세율(tCO₂e당 5만원) 기반 시나리오 추정치입니다. 실제 과세액과 다를 수 있습니다. 클릭하면 회사별 리스크 상세 분석 페이지로 이동합니다."
            value={formatKrw(summary.totalTaxKrw)}
            helper={`고위험 ${summary.highRiskCount}개사 · 시나리오 기준`}
            icon={Banknote}
            helperClassName={
                summary.highRiskCount > 0 ? 'text-destructive' : 'text-muted-foreground'
            }
            href={ROUTES.risk}
        />
    );
}

type Props = {
    year: number;
    emissionsSummary: DashboardEmissionsSummary;
    pcfSummary: DashboardPcfSummary;
    scopeTotals: Record<1 | 2 | 3, number>;
    riskSummary: RiskSummary;
};

export function KpiCards({
    year,
    emissionsSummary,
    pcfSummary,
    scopeTotals,
    riskSummary,
}: Props) {
    const [mode, setMode] = useState<KpiMode>('pcf');
    const summary = mode === 'pcf' ? pcfSummary : emissionsSummary;

    return (
        <Tabs value={mode} onValueChange={(value) => setMode(value as KpiMode)}>
            <div className="flex justify-end">
                <TabsList aria-label="대시보드 KPI 기준">
                    <TabsTrigger value="pcf">PCF</TabsTrigger>
                    <TabsTrigger value="emissions">배출량</TabsTrigger>
                </TabsList>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <AnnualMetricCard mode={mode} summary={summary} year={year} />
                <MonthlyMetricCard mode={mode} summary={summary} year={year} />
                <ScopeBreakdownCard scopeTotals={scopeTotals} />
                <TaxExposureCard summary={riskSummary} />
            </div>
        </Tabs>
    );
}
