// 대시보드 상단 KPI 요약 카드 4종 렌더링

import { CardHeading } from '@/components/shared/card-heading';
import { ChartSkeleton } from '@/components/shared/loading-skeletons';
import { MetricCard } from '@/components/shared/metric-card';
import { Card } from '@/components/ui/card';
import dynamic from 'next/dynamic';

// recharts 번들을 초기 JS에서 분리하기 위한 동적 임포트
const ScopeDonutChart = dynamic(
    () =>
        import('@/components/shared/scope-donut-chart').then((m) => ({
            default: m.ScopeDonutChart,
        })),
    { loading: () => <ChartSkeleton className="h-36 rounded-lg" />, ssr: false }
);
import { SCOPES } from '@/constants/ghg-scope';
import { ROUTES } from '@/constants/navigation';
import type { DashboardPcfSummary } from '@/hooks/dashboard/useDashboardMetrics';
import { formatKrw, formatPcfEmissions, formatYearMonth, getTrendProps } from '@/lib/format';
import type { RiskSummary } from '@/lib/risk';
import { Banknote } from 'lucide-react';
import Link from 'next/link';

// 활동 데이터 기반 연간 총 PCF + 전년 대비 변화율 카드
function AnnualPcfCard({ summary, year }: { summary: DashboardPcfSummary; year: number }) {
    const hasRecords = summary.recordCount > 0;
    const trend = getTrendProps(summary.yoyChange);
    return (
        <MetricCard
            title="연간 총 PCF"
            tooltip="선택한 연도에 업로드된 원본 활동 데이터의 PCF 산정 배출량 합산입니다. 변화율은 작년 같은 기간(1월~최신 월) 대비 증감률입니다."
            value={
                hasRecords ? (
                    <>
                        {formatPcfEmissions(summary.annualTotal)}
                        <span className="text-muted-foreground ml-1 text-sm font-normal">
                            kgCO₂e
                        </span>
                    </>
                ) : (
                    '-'
                )
            }
            helper={
                !hasRecords
                    ? `${year}년 PCF 데이터 없음`
                    : summary.yoyChange !== null
                      ? `${trend.label} 작년 같은 기간 대비`
                      : `${year}년 활동 데이터 기준`
            }
            icon={hasRecords && summary.yoyChange !== null ? trend.Icon : undefined}
            helperClassName={
                hasRecords && summary.yoyChange !== null ? trend.className : 'text-muted-foreground'
            }
        />
    );
}

// 최근 월 PCF 및 전년 동월 대비 변화율 카드
function MonthlyPcfCard({ summary, year }: { summary: DashboardPcfSummary; year: number }) {
    const trend = getTrendProps(summary.momYoyChange);
    return (
        <MetricCard
            title="최근 월 PCF"
            tooltip="선택 연도에 업로드된 원본 활동 데이터 중 마지막 월의 PCF 산정 배출량입니다. 변화율은 전년 같은 달 대비 증감률입니다."
            value={
                summary.latestMonth ? (
                    <>
                        {formatPcfEmissions(summary.latestMonth.total)}
                        <span className="text-muted-foreground ml-1 text-sm font-normal">
                            kgCO₂e
                        </span>
                    </>
                ) : (
                    '-'
                )
            }
            helper={
                summary.latestMonth
                    ? summary.momYoyChange !== null
                        ? `${trend.label} 전년 동월 대비 · ${formatYearMonth(summary.latestMonth.month)}`
                        : formatYearMonth(summary.latestMonth.month)
                    : `${year}년 PCF 데이터 없음`
            }
            icon={summary.momYoyChange !== null ? trend.Icon : undefined}
            helperClassName={
                summary.momYoyChange !== null ? trend.className : 'text-muted-foreground'
            }
        />
    );
}

// Scope별 배출 구성 카드 — 가로 스택 바로 비율 표시, 배출원 분석 진입점
function ScopeBreakdownCard({ scopeTotals }: { scopeTotals: Record<1 | 2 | 3, number> }) {
    const total = scopeTotals[1] + scopeTotals[2] + scopeTotals[3];
    const pct = (s: 1 | 2 | 3) => (total > 0 ? (scopeTotals[s] / total) * 100 : 0);
    const scopeBarItems = SCOPES.map((s) => ({ scope: s, pct: pct(s) }));

    return (
        <Link href={ROUTES.sources} className="block">
            <Card className="cursor-pointer gap-0 transition-shadow hover:shadow-md">
                <CardHeading
                    title="Scope별 배출 구성"
                    tooltip="관리 대상 전체의 Scope 1(직접 배출) · Scope 2(전기·열·증기) · Scope 3(가치사슬) 비율입니다. 배출원 분석 페이지에서 배출원별 상세 현황을 확인할 수 있습니다."
                    className="pb-2"
                    titleClassName="text-sm font-medium text-muted-foreground"
                />
                <ScopeDonutChart scopes={scopeBarItems} />
            </Card>
        </Link>
    );
}

// 탄소세 예상 노출액 카드 — 리스크 페이지 진입점
function TaxExposureCard({ summary }: { summary: RiskSummary }) {
    return (
        <MetricCard
            title="탄소세 예상 노출액"
            tooltip="가정 세율(tCO₂e당 5만 원) 기반 시나리오 추정치입니다. 실제 과세액과 다를 수 있습니다. 클릭하면 회사별 리스크 상세 분석 페이지로 이동합니다."
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
    pcfSummary: DashboardPcfSummary;
    scopeTotals: Record<1 | 2 | 3, number>;
    riskSummary: RiskSummary;
};

// KPI 카드 4종 조합 렌더링
export function KpiCards({ year, pcfSummary, scopeTotals, riskSummary }: Props) {
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <AnnualPcfCard summary={pcfSummary} year={year} />
            <MonthlyPcfCard summary={pcfSummary} year={year} />
            <ScopeBreakdownCard scopeTotals={scopeTotals} />
            <TaxExposureCard summary={riskSummary} />
        </div>
    );
}
