'use client';

// 회사 상세 리스크 분석 카드 — 등급·점수·노출액·추세·사유 통합 표시

import { RiskLevelBadge } from '@/components/risk/risk-level-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RISK_BAR_COLORS } from '@/constants/risk';
import { ROUTES } from '@/constants/navigation';
import type { RiskAssessment } from '@/lib/risk';
import { formatKrw, getTrendProps } from '@/lib/format';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

type Props = {
    assessment: RiskAssessment;
    rank: number | null;
    total: number;
};

// 리스크 분석 요약 카드 렌더링
export function CompanyRiskCard({ assessment, rank, total }: Props) {
    const { level, score, estimatedAllowanceCostKrw, recentTrendPct, reasons } = assessment;
    const trend = getTrendProps(recentTrendPct);

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                        <CardTitle>리스크 분석</CardTitle>
                        <RiskLevelBadge level={level} />
                    </div>
                    <Link
                        href={ROUTES.risk}
                        className="text-muted-foreground hover:text-foreground flex shrink-0 items-center gap-1 text-sm transition-colors"
                    >
                        전체 비교
                        <ArrowRight className="size-3.5" />
                    </Link>
                </div>

                {/* 리스크 점수 프로그레스 바 */}
                <div className="mt-2 space-y-1.5">
                    <div className="text-muted-foreground flex justify-between text-xs">
                        <span>리스크 점수</span>
                        <div className="flex items-center gap-2">
                            {rank !== null && (
                                <span>
                                    전체 {total}개사 중{' '}
                                    <span className="text-foreground font-medium">{rank}위</span>
                                </span>
                            )}
                            <span className="text-foreground font-medium">{score}점 / 100점</span>
                        </div>
                    </div>
                    <div className="bg-muted h-2 overflow-hidden rounded-full">
                        <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${score}%`, backgroundColor: RISK_BAR_COLORS[level] }}
                        />
                    </div>
                </div>
            </CardHeader>

            <CardContent>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {/* 수치 정보 */}
                    <div className="space-y-4">
                        <div>
                            <p className="text-muted-foreground text-xs">예상 배출권 구매비용</p>
                            <p className="text-xl font-semibold">{formatKrw(estimatedAllowanceCostKrw)}</p>
                            <p className="text-muted-foreground text-xs">
                                시나리오 기준 (5만원/배출권)
                            </p>
                        </div>
                        <div>
                            <p className="text-muted-foreground text-xs">최근 배출 추세</p>
                            <p
                                className={`flex items-center gap-1 text-xl font-semibold ${trend.className}`}
                            >
                                {trend.Icon && <trend.Icon className="size-4" />}
                                {trend.label}
                            </p>
                            <p className="text-muted-foreground text-xs">최근 3개월 평균 대비</p>
                        </div>
                    </div>

                    {/* 주요 사유 */}
                    <div>
                        <p className="text-muted-foreground mb-2 text-xs">주요 정보</p>
                        <ul className="space-y-2">
                            {reasons.map((reason, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm">
                                    <span className="bg-muted-foreground mt-1.5 size-1.5 shrink-0 rounded-full" />
                                    {reason}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
