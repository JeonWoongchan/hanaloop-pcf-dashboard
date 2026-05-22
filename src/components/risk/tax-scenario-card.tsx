// 탄소세 시나리오 가정 카드 렌더링

import { CardHeading } from '@/components/shared/card-heading';
import { Card, CardContent } from '@/components/ui/card';
import { CARBON_TAX_RATE_KRW_PER_TCO2E } from '@/constants/risk';
import { formatEmissions } from '@/lib/format';

export function TaxScenarioCard() {
    return (
        <Card>
            <CardHeading
                title="탄소세 시나리오 가정"
                description="실제 세무·법률 자문이 아니라 제한된 과제 데이터 기반의 내부 판단용 시나리오입니다."
            />
            <CardContent>
                <dl className="text-muted-foreground grid gap-4 text-sm md:grid-cols-3">
                    <div>
                        <dt className="text-foreground font-medium">가정 세율</dt>
                        <dd>{formatEmissions(CARBON_TAX_RATE_KRW_PER_TCO2E)}원 / tCO₂e</dd>
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
