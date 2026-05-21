// 회사 카드 — 연간 배출량 및 GHG Scope 비중 시각화

import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { SCOPE_COLORS } from '@/constants/ghg-scope';
import { ROUTES } from '@/constants/navigation';
import { getScopeBreakdown } from '@/lib/emissions';
import { formatEmissions } from '@/lib/format';
import type { CompanyWithTotal } from '@/types';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

// 회사 배출 현황 카드 렌더링
export function CompanyCard({ company, year }: { company: CompanyWithTotal; year: number }) {
    const scopes = getScopeBreakdown(company.emissions);

    return (
        <Card className="flex flex-col transition-shadow hover:shadow-md">
            <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold leading-tight">{company.name}</h3>
                    <span className="shrink-0 text-sm text-muted-foreground">
                        {company.country}
                    </span>
                </div>
            </CardHeader>

            <CardContent className="flex-1 space-y-3">
                {/* 연간 총 배출량 */}
                <div>
                    <p className="text-2xl font-bold">{formatEmissions(company.total)}</p>
                    <p className="text-xs text-muted-foreground">tCO₂e · {year}년 연간</p>
                </div>

                {/* GHG Scope 비중 스택 바 */}
                <div className="space-y-1.5">
                    <div className="flex h-2 overflow-hidden rounded-full bg-muted">
                        {scopes.map(({ scope, pct }) => (
                            <div
                                key={scope}
                                style={{
                                    width: `${pct}%`,
                                    backgroundColor: SCOPE_COLORS[scope],
                                }}
                            />
                        ))}
                    </div>
                    {/* Scope 레이블 — 색상 점으로 바와 연동, 고정 크기로 가독성 확보 */}
                    <div className="flex flex-wrap gap-x-3 gap-y-1">
                        {scopes.map(({ scope, pct }) =>
                            pct > 0 ? (
                                <span
                                    key={scope}
                                    className="flex items-center gap-1 text-xs text-muted-foreground"
                                >
                                    <span
                                        className="size-2 shrink-0 rounded-sm"
                                        style={{ backgroundColor: SCOPE_COLORS[scope] }}
                                    />
                                    S{scope} {Math.round(pct)}%
                                </span>
                            ) : null
                        )}
                    </div>
                </div>
            </CardContent>

            <CardFooter className="border-t pt-3">
                <Link
                    href={ROUTES.companyDetail(company.id)}
                    className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                    상세 보기
                    <ArrowRight className="size-4" />
                </Link>
            </CardFooter>
        </Card>
    );
}
