// 회사 카드 — 연간 배출량 및 GHG Scope 비중 시각화

import { RiskLevelBadge } from '@/components/risk/risk-level-badge';
import { ScopeStackedBar } from '@/components/shared/scope-stacked-bar';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ROUTES } from '@/constants/navigation';
import { filterByYear, getScopeBreakdown } from '@/lib/emissions';
import { formatEmissions } from '@/lib/format';
import type { RiskAssessment } from '@/lib/risk';
import type { CompanyWithTotal } from '@/types';
import Link from 'next/link';

// 회사 배출 현황 카드 렌더링
export function CompanyCard({
    company,
    year,
    riskAssessment,
}: {
    company: CompanyWithTotal;
    year: number;
    riskAssessment?: RiskAssessment;
}) {
    // Scope 비중도 총 배출량과 동일하게 선택 연도 기준으로 산정
    const scopes = getScopeBreakdown(filterByYear(company.emissions, year));

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
                    {/* 연간 총 배출량 */}
                    <div>
                        <p className="text-2xl font-bold">{formatEmissions(company.total)}</p>
                        <p className="text-muted-foreground text-xs">tCO₂e · {year}년 연간</p>
                    </div>

                    {/* GHG Scope 비중 스택 바 */}
                    <ScopeStackedBar scopes={scopes} showBackground />
                </CardContent>
            </Card>
        </Link>
    );
}
