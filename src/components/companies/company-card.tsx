'use client';

// 회사 카드 — 연간 PCF 및 Scope 비중 시각화 + 편집·삭제 액션

import { Pencil } from 'lucide-react';
import { RiskLevelBadge } from '@/components/risk/risk-level-badge';
import { DeleteConfirmButton } from '@/components/shared/delete-confirm-button';
import { ScopeStackedBar } from '@/components/shared/scope-stacked-bar';
import { Button } from '@/components/ui/button';
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

type Props = {
    company: CompanyPcfTotal;
    year: number;
    riskAssessment?: RiskAssessment;
    onEditAction?: () => void;
    onDeleteAction?: () => void;
    isDeleting?: boolean;
};

// 회사 PCF 현황 카드 렌더링
export function CompanyCard({
    company,
    year,
    riskAssessment,
    onEditAction,
    onDeleteAction,
    isDeleting,
}: Props) {
    const pcfView = getCompanyCardPcfView(company);
    const hasActions = Boolean(onEditAction ?? onDeleteAction);

    return (
        <Card className="flex flex-col transition-shadow hover:shadow-md">
            {/* 카드 본문은 Link — 상세 페이지로 이동 */}
            <Link href={ROUTES.companyDetail(company.id)} className="flex-1">
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
                        <div className="flex items-baseline gap-1.5">
                            <p className="text-2xl font-bold">{pcfView.totalLabel}</p>
                            {pcfView.hasPcfRecords && (
                                <span className="text-muted-foreground text-xs font-medium">
                                    kgCO₂e
                                </span>
                            )}
                        </div>
                        <p className="text-muted-foreground text-xs">
                            {pcfView.hasPcfRecords
                                ? `${year}년 연간 PCF`
                                : `${year}년 PCF 데이터 없음`}
                        </p>
                    </div>

                    <ScopeStackedBar scopes={pcfView.scopes} showBackground />
                </CardContent>
            </Link>

            {/* 편집·삭제 버튼 — Link 외부에 별도 배치 */}
            {hasActions && (
                <div className="border-border flex items-center justify-end gap-1 border-t px-3 py-2">
                    {onEditAction && (
                        <Button
                            size="icon"
                            variant="ghost"
                            className="text-muted-foreground hover:text-foreground size-7"
                            onClick={onEditAction}
                            aria-label="회사 정보 수정"
                        >
                            <Pencil className="size-3.5" />
                        </Button>
                    )}
                    {onDeleteAction && (
                        <DeleteConfirmButton onConfirm={onDeleteAction} disabled={isDeleting} />
                    )}
                </div>
            )}
        </Card>
    );
}
