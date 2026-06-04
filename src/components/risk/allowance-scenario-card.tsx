'use client';

// 배출권 비용 시나리오 가정 카드 렌더링 — DB에서 현재 단가와 기준일 조회

import { CardHeading } from '@/components/shared/card-heading';
import { Card, CardContent } from '@/components/ui/card';
import { ALLOWANCE_PRICE_KRW_PER_TCO2E } from '@/constants/risk';
import { useAllowancePrice } from '@/hooks/allowance-price/useAllowancePrice';
import { formatEmissions } from '@/lib/format';

type Props = { year: number };

export function AllowanceScenarioCard({ year }: Props) {
    const { data: allowanceData } = useAllowancePrice(year);
    const priceKrw = allowanceData?.priceKrw ?? ALLOWANCE_PRICE_KRW_PER_TCO2E;

    return (
        <Card>
            <CardHeading
                title="배출권 비용 시나리오 가정"
                description="실제 세무·법률 자문이 아니라 제한된 과제 데이터 기반의 내부 판단용 시나리오입니다."
            />
            <CardContent>
                <dl className="text-muted-foreground grid gap-4 text-sm md:grid-cols-3">
                    <div>
                        <dt className="text-foreground font-medium">가정 배출권 단가</dt>
                        <dd>
                            {formatEmissions(priceKrw)}원 / 배출권
                            {allowanceData?.effectiveFrom && (
                                <span className="text-muted-foreground ml-1.5 text-xs">
                                    ({allowanceData.effectiveFrom} 기준)
                                </span>
                            )}
                        </dd>
                    </div>
                    <div>
                        <dt className="text-foreground font-medium">점수 산정</dt>
                        <dd>연간 배출량, 최근 3개월 증가율, Scope 구성을 종합합니다.</dd>
                    </div>
                    <div>
                        <dt className="text-foreground font-medium">활용 목적</dt>
                        <dd>규제 대응과 감축 조치가 필요한 관리 대상을 먼저 찾습니다.</dd>
                    </div>
                </dl>
            </CardContent>
        </Card>
    );
}
