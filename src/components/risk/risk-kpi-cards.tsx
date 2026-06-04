'use client';

// 리스크 페이지 상단 KPI 카드 렌더링

import { MetricCard } from '@/components/shared/metric-card';
import { ALLOWANCE_PRICE_KRW_PER_TCO2E } from '@/constants/risk';
import { useAllowancePrice } from '@/hooks/allowance-price/useAllowancePrice';
import { formatEmissions, formatKrw } from '@/lib/format';
import type { RiskSummary } from '@/lib/risk';
import { AlertTriangle, Calculator, Gauge, Tickets } from 'lucide-react';

type Props = {
    summary: RiskSummary;
    year: number;
    totalCompanies: number;
};

// 리스크 KPI 카드 목록 조합
export function RiskKpiCards({ summary, year, totalCompanies }: Props) {
    const { data: allowanceData } = useAllowancePrice(year);
    const priceKrw = allowanceData?.priceKrw ?? ALLOWANCE_PRICE_KRW_PER_TCO2E;
    const priceLabel = allowanceData
        ? `${formatEmissions(priceKrw)}원/배출권 (${allowanceData.effectiveFrom} 기준)`
        : `${formatEmissions(priceKrw)}원/배출권`;

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
                title="예상 배출권 구매비용"
                tooltip={`선택 연도 총 배출량(tCO₂e)에 가정 배출권 단가 ${priceLabel}을 곱한 시나리오 금액입니다. 무상할당·보유 배출권을 고려하지 않은 단순 추정치입니다.`}
                value={formatKrw(summary.totalAllowanceCostKrw)}
                helper={`${year}년 관리 대상 전체`}
                icon={Calculator}
            />
            <MetricCard
                title="총 필요 배출권"
                tooltip="선택 연도 총 배출량을 1 tCO₂e당 배출권 1개 기준으로 올림 환산한 수량입니다. 실제 부족분은 무상할당량과 보유 배출권에 따라 달라집니다."
                value={`${formatEmissions(summary.totalRequiredAllowances)}개`}
                helper="1 tCO₂e = 배출권 1개"
                icon={Tickets}
            />
            <MetricCard
                title="High Risk 회사"
                tooltip="리스크 점수가 70점 이상인 관리 대상 회사 수입니다. 배출량, 최근 증가 추세, Scope 구성을 종합합니다."
                value={
                    <>
                        <span className="text-destructive">{summary.highRiskCount}</span>
                        <span className="text-muted-foreground"> / {totalCompanies}</span>
                    </>
                }
                helper="우선 검토 대상"
                icon={AlertTriangle}
            />
            <MetricCard
                title="평균 리스크 점수"
                tooltip="관리 대상 회사의 리스크 점수 평균입니다. 100점에 가까울수록 배출권 비용·규제 대응 우선순위가 높습니다."
                value={summary.averageScore}
                helper="100점 만점"
                icon={Gauge}
            />
        </div>
    );
}
