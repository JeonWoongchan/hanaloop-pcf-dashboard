// 회사 카드 — 연간 PCF 및 Scope 비중 시각화

import { RiskLevelBadge } from '@/components/risk/risk-level-badge';
import { ScopeStackedBar } from '@/components/shared/scope-stacked-bar';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ROUTES } from '@/constants/navigation';
import { getPcfScopeBreakdown, type CompanyPcfTotal } from '@/lib/emissions';
import { formatPcfEmissions } from '@/lib/format';
import type { RiskAssessment } from '@/lib/risk';
import Link from 'next/link';

function getCompanyCardPcfView(company: CompanyPcfTotal) {
    const hasPcfRecords = company.activityRecords.length > 0;

    return {
        hasPcfRecords,
        totalLabel: hasPcfRecords ? formatPcfEmissions(company.total) : '-',
        scopes: getPcfScopeBreakdown(company.activityRecords),
    };
}

// 회사 PCF 현황 카드 렌더링
export function CompanyCard({
    company,
    year,
    riskAssessment,
}: {
    company: CompanyPcfTotal;
    year: number;
    riskAssessment?: RiskAssessment;
}) {
    const pcfView = getCompanyCardPcfView(company);

    return (
        <Link href={ROUTES.companyDetail(company.id)} className="block">
            <Card className="flex flex-col transition-shadow hover:shadow-md">
                <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                        {/* 회사명 + 국가 코드 */}
                        <div className="min-w-0">
                            <h3 className="truncate leading-tight font-semibold">{company.name}</h3>
                            <p className="text-muted-foreground text-xs">{company.country}</p>
                        </div>
                        {/* 리스크 뱃지 우측 상단 고정 */}
                        {riskAssessment && (
                            <div className="shrink-0">
                                <RiskLevelBadge level={riskAssessment.level} />
                            </div>
                        )}
                    </div>
                    {riskAssessment && (
                        <p className="text-muted-foreground text-xs">
                            리스크 점수{' '}
                            <span className="text-foreground font-medium">
                                {riskAssessment.score}점
                            </span>
                        </p>
                    )}
                </CardHeader>

                <CardContent className="flex-1 space-y-3">
                    <div>
                        <p className="text-2xl font-bold">{pcfView.totalLabel}</p>
                        <p className="text-muted-foreground text-xs">
                            {pcfView.hasPcfRecords
                                ? `kgCO₂e · ${year}년 연간 PCF`
                                : `${year}년 PCF 데이터 없음`}
                        </p>
                    </div>

                    <ScopeStackedBar scopes={pcfView.scopes} showBackground />
                </CardContent>
            </Card>
        </Link>
    );
}
