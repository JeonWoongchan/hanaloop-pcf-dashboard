// 회사별 리스크 우선순위 테이블 렌더링

import { InfoTooltip } from '@/components/shared/info-tooltip';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CARBON_TAX_RATE_KRW_PER_TCO2E } from '@/constants/risk';
import { formatEmissions } from '@/lib/format';
import type { RiskAssessment } from '@/lib/risk';
import { RiskPriorityRow } from './risk-priority-row';

type Props = {
    assessments: RiskAssessment[];
    year: number;
};

// 회사별 리스크 우선순위 테이블 조합
export function RiskPriorityTable({ assessments, year }: Props) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center">
                    관리 우선순위
                    <InfoTooltip content="리스크 점수는 연간 배출량, 최근 3개월 증가 추세, Scope 구성을 종합해 산정합니다. 실제 규제 등급이 아니라 내부 판단용 지표입니다." />
                </CardTitle>
                <CardDescription>
                    {year}년 기준 탄소세 노출액과 배출 증가 리스크가 큰 관리 대상 회사
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-230 text-sm">
                        <caption className="sr-only">
                            {year}년 관리 대상 회사별 탄소세 리스크 우선순위
                        </caption>
                        <thead>
                            <tr className="border-b text-left text-muted-foreground">
                                <th scope="col" className="py-3 pr-4 font-medium">회사</th>
                                <th scope="col" className="py-3 pr-4 text-center font-medium">등급</th>
                                <th scope="col" className="py-3 pr-4 text-center font-medium">점수</th>
                                <th scope="col" className="py-3 pr-4 text-right font-medium">연간 배출량</th>
                                <th scope="col" className="py-3 pr-4 text-right font-medium">
                                    <span className="inline-flex items-center justify-end">
                                        예상 비용
                                        <InfoTooltip
                                            content={`예상 비용 = 선택 연도 연간 배출량 × 가정 세율(${formatEmissions(CARBON_TAX_RATE_KRW_PER_TCO2E)}원/tCO₂e)입니다. 실제 세무·법률 산정이 아니라 관리 우선순위 판단을 위한 시나리오입니다.`}
                                        />
                                    </span>
                                </th>
                                <th scope="col" className="py-3 pr-4 text-center font-medium">최근 추세</th>
                                <th scope="col" className="py-3 pr-4 text-center font-medium">주요 Scope</th>
                                <th scope="col" className="py-3 font-medium">리스크 사유</th>
                            </tr>
                        </thead>
                        <tbody>
                            {assessments.map((assessment) => (
                                <RiskPriorityRow key={assessment.id} assessment={assessment} />
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}
