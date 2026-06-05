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
                        <dt className="text-foreground font-medium">필요 배출권</dt>
                        <dd>1 tCO₂e를 배출권 1개로 보고 연간 배출량을 올림 환산합니다.</dd>
                    </div>
                    <div>
                        <dt className="text-foreground font-medium">활용 목적</dt>
                        <dd>무상할당·보유 배출권을 제외한 총 필요량 기준으로 우선순위를 봅니다.</dd>
                    </div>
                </dl>
            </CardContent>
        </Card>
    );
}
