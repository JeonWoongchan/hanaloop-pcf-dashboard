// 대시보드 상단 KPI 요약 카드 4종 렌더링

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { CompanyTotal, MonthlyTotal } from '@/lib/emissions';
import { Activity, Building2, TrendingDown, TrendingUp } from 'lucide-react';

// yearMonth 문자열을 "YYYY년 M월" 형식으로 변환
function formatYearMonth(ym: string): string {
    const [year, month] = ym.split('-');
    return `${year}년 ${parseInt(month)}월`;
}

// 배출량 숫자를 천 단위 구분자 포함 문자열로 변환
function formatEmissions(value: number): string {
    return value.toLocaleString('ko-KR');
}

// 전월 대비 변화율 부호 및 색상 클래스 반환
function getTrendProps(change: number | null) {
    if (change === null) return { label: '-', className: 'text-muted-foreground', Icon: Activity };
    const isDecrease = change < 0;
    return {
        label: `${isDecrease ? '' : '+'}${change.toFixed(1)}%`,
        className: isDecrease ? 'text-success' : 'text-destructive',
        Icon: isDecrease ? TrendingDown : TrendingUp,
    };
}

// 연간 총 배출량 카드
function AnnualEmissionsCard({ total }: { total: number }) {
    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    연간 총 배출량
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-2xl font-bold">{formatEmissions(total)}</p>
                <p className="mt-1 text-xs text-muted-foreground">tCO₂e · 2024년 전체</p>
            </CardContent>
        </Card>
    );
}

// 최근 월 배출량 및 전월 대비 변화율 카드
function MonthlyEmissionsCard({
    latest,
    momChange,
}: {
    latest: MonthlyTotal | undefined;
    momChange: number | null;
}) {
    const trend = getTrendProps(momChange);
    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    최근 월 배출량
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-2xl font-bold">
                    {latest ? formatEmissions(latest.total) : '-'}
                </p>
                <p className={`mt-1 flex items-center gap-1 text-xs ${trend.className}`}>
                    <trend.Icon className="size-3" />
                    {trend.label} 전월 대비
                    {latest && (
                        <span className="ml-1 text-muted-foreground">
                            · {formatYearMonth(latest.month)}
                        </span>
                    )}
                </p>
            </CardContent>
        </Card>
    );
}

// 연간 기준 최다 배출 기업 카드
function TopEmitterCard({ company }: { company: CompanyTotal | undefined }) {
    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    최다 배출 기업
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="truncate text-2xl font-bold">{company?.name ?? '-'}</p>
                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <Building2 className="size-3" />
                    {company ? `${formatEmissions(company.total)} tCO₂e / 연간` : '-'}
                </p>
            </CardContent>
        </Card>
    );
}

// 1월 대비 12월 배출량 감소 기업 수 카드
function ImprovingCompaniesCard({
    count,
    total,
}: {
    count: number;
    total: number;
}) {
    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    감소 추세 기업
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-2xl font-bold">
                    <span className="text-success">{count}</span>
                    <span className="text-muted-foreground"> / {total}</span>
                </p>
                <p className="mt-1 text-xs text-muted-foreground">1월 대비 12월 배출량 감소</p>
            </CardContent>
        </Card>
    );
}

type Props = {
    monthlyTotals: MonthlyTotal[];
    momChange: number | null;
    totalByCompany: CompanyTotal[];
    improvingCount: number;
    totalCompanies: number;
};

// KPI 카드 4종 조합 렌더링
export function KpiCards({ monthlyTotals, momChange, totalByCompany, improvingCount, totalCompanies }: Props) {
    const annualTotal = monthlyTotals.reduce((sum, m) => sum + m.total, 0);
    const latestMonth = monthlyTotals[monthlyTotals.length - 1];

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <AnnualEmissionsCard total={annualTotal} />
            <MonthlyEmissionsCard latest={latestMonth} momChange={momChange} />
            <TopEmitterCard company={totalByCompany[0]} />
            <ImprovingCompaniesCard count={improvingCount} total={totalCompanies} />
        </div>
    );
}
