// 대시보드 상단 KPI 요약 카드 4종 렌더링

import { CardHeading } from '@/components/shared/card-heading';
import { MetricCard } from '@/components/shared/metric-card';
import { ScopeStackedBar } from '@/components/shared/scope-stacked-bar';
import { Card, CardContent } from '@/components/ui/card';
import { SCOPES } from '@/constants/ghg-scope';
import { ROUTES } from '@/constants/navigation';
import type { MonthlyTotal } from '@/lib/emissions';
import { formatEmissions, formatKrw, formatYearMonth, getTrendProps } from '@/lib/format';
import type { RiskSummary } from '@/lib/risk';
import { Banknote } from 'lucide-react';
import Link from 'next/link';

// 연간 총 배출량 + 전년 대비 변화율 카드
function AnnualEmissionsCard({
    total,
    year,
    yoyChange,
}: {
    total: number;
    year: number;
    yoyChange: number | null;
}) {
    const trend = getTrendProps(yoyChange);
    return (
        <MetricCard
            title="연간 총 배출량"
            tooltip="선택한 연도의 관리 대상 전체 온실가스 배출량 합산입니다. 변화율은 작년 같은 기간(1월~최신 월) 대비 증감률이며, 상단 연도 선택기로 연도를 변경할 수 있습니다."
            value={formatEmissions(total)}
            helper={
                yoyChange !== null
                    ? `${trend.label} 작년 같은 기간 대비`
                    : `${year}년 관리 대상 전체`
            }
            icon={yoyChange !== null ? trend.Icon : undefined}
            helperClassName={yoyChange !== null ? trend.className : 'text-muted-foreground'}
        />
    );
}

// 최근 월 배출량 및 전년 동월 대비 변화율 카드
function MonthlyEmissionsCard({
    latest,
    momYoyChange,
}: {
    latest: MonthlyTotal | undefined;
    momYoyChange: number | null;
}) {
    const trend = getTrendProps(momYoyChange);
    return (
        <MetricCard
            title="최근 월 배출량"
            tooltip="선택 연도의 마지막 월(최신 데이터) 배출량입니다. 변화율은 전년 같은 달 대비 증감률이며, 초록색은 감소(개선), 빨간색은 증가(악화)를 나타냅니다."
            value={
                latest ? (
                    <>
                        {formatEmissions(latest.total)}
                        <span className="ml-1 text-sm font-normal text-muted-foreground">(tCO₂e)</span>
                    </>
                ) : '-'
            }
            helper={
                latest
                    ? momYoyChange !== null
                        ? `${trend.label} 전년 동월 대비 · ${formatYearMonth(latest.month)}`
                        : formatYearMonth(latest.month)
                    : '-'
            }
            icon={momYoyChange !== null ? trend.Icon : undefined}
            helperClassName={momYoyChange !== null ? trend.className : 'text-muted-foreground'}
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
            <Card className="cursor-pointer transition-shadow hover:shadow-md">
                <CardHeading
                    title="Scope별 배출 구성"
                    tooltip="관리 대상 전체의 Scope 1(직접 배출) · Scope 2(전기·열) · Scope 3(가치사슬) 비율입니다. 배출원 분석 페이지에서 배출원별 상세 현황을 확인할 수 있습니다."
                    className="pb-2"
                    titleClassName="text-sm font-medium text-muted-foreground"
                />
                <CardContent className="h-13">
                    <ScopeStackedBar scopes={scopeBarItems} isKpiCard={true}/>
                </CardContent>
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
            helperClassName={summary.highRiskCount > 0 ? 'text-destructive' : 'text-muted-foreground'}
            href={ROUTES.risk}
        />
    );
}

type Props = {
    year: number;
    annualTotal: number;
    latestMonth: MonthlyTotal | null;
    momYoyChange: number | null;
    scopeTotals: Record<1 | 2 | 3, number>;
    yoyChange: number | null;
    riskSummary: RiskSummary;
};

// KPI 카드 4종 조합 렌더링
export function KpiCards({ year, annualTotal, latestMonth, momYoyChange, scopeTotals, yoyChange, riskSummary }: Props) {

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <AnnualEmissionsCard total={annualTotal} year={year} yoyChange={yoyChange} />
            <MonthlyEmissionsCard latest={latestMonth} momYoyChange={momYoyChange} />
            <ScopeBreakdownCard scopeTotals={scopeTotals} />
            <TaxExposureCard summary={riskSummary} />
        </div>
    );
}
