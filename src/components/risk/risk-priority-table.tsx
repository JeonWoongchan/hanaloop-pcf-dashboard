'use client';

import { useMemo } from 'react';
import { CardHeading } from '@/components/shared/card-heading';
import { InfoTooltip } from '@/components/shared/info-tooltip';
import { SortableHead } from '@/components/shared/sortable-head';
import { Card, CardContent } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCaption,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { ALLOWANCE_PRICE_KRW_PER_TCO2E } from '@/constants/risk';
import {
    compareByDirection,
    compareNullableNumber,
    sortByState,
    useSort,
    type SortComparators,
} from '@/hooks/shared/useSort';
import { formatEmissions } from '@/lib/format';
import type { RiskAssessment, RiskLevel } from '@/lib/risk';
import { RiskPriorityRow } from './risk-priority-row';

type SortKey =
    | 'name'
    | 'score'
    | 'annualEmissions'
    | 'requiredAllowances'
    | 'estimatedAllowanceCostKrw'
    | 'recentTrendPct'
    | 'level';

const LEVEL_ORDER: Record<RiskLevel, number> = { high: 3, medium: 2, low: 1 };

const SORT_COMPARATORS: SortComparators<RiskAssessment, SortKey> = {
    name: (a, b, direction) => compareByDirection(a.name.localeCompare(b.name, 'ko'), direction),
    level: (a, b, direction) =>
        compareByDirection(LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level], direction),
    score: (a, b, direction) => compareByDirection(a.score - b.score, direction),
    annualEmissions: (a, b, direction) =>
        compareByDirection(a.annualEmissions - b.annualEmissions, direction),
    requiredAllowances: (a, b, direction) =>
        compareByDirection(a.requiredAllowances - b.requiredAllowances, direction),
    estimatedAllowanceCostKrw: (a, b, direction) =>
        compareByDirection(a.estimatedAllowanceCostKrw - b.estimatedAllowanceCostKrw, direction),
    recentTrendPct: (a, b, direction) =>
        compareNullableNumber(a.recentTrendPct, b.recentTrendPct, direction),
};

type Props = {
    assessments: RiskAssessment[];
    year: number;
};

export function RiskPriorityTable({ assessments, year }: Props) {
    const sort = useSort<SortKey>({ initialKey: 'score', initialDirection: 'desc' });

    const sorted = useMemo(
        () =>
            sortByState(
                assessments,
                { sortKey: sort.sortKey, sortDir: sort.sortDir },
                SORT_COMPARATORS
            ),
        [assessments, sort.sortKey, sort.sortDir]
    );

    return (
        <Card>
            <CardHeading
                title="관리 우선순위"
                tooltip="리스크 점수는 연간 배출량, 최근 3개월 증가 추세, Scope 구성을 종합해 산정합니다. 실제 규제 등급이 아니라 내부 판단 지표입니다."
                description={`${year}년 기준 배출권 구매비용과 배출 증가 리스크가 큰 관리 대상 회사`}
            />
            <CardContent>
                <Table className="min-w-260">
                    <TableCaption className="sr-only">
                        {year}년 관리 대상 회사별 배출권 비용 리스크 우선순위
                    </TableCaption>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent">
                            <SortableHead {...sort.getSortProps('name')} label="회사">
                                회사
                            </SortableHead>
                            <SortableHead
                                {...sort.getSortProps('level')}
                                label="등급"
                                align="center"
                            >
                                등급
                            </SortableHead>
                            <SortableHead
                                {...sort.getSortProps('score')}
                                label="점수"
                                align="center"
                            >
                                점수
                            </SortableHead>
                            <SortableHead
                                {...sort.getSortProps('annualEmissions')}
                                label="연간 배출량"
                                align="right"
                            >
                                연간 배출량
                            </SortableHead>
                            <SortableHead
                                {...sort.getSortProps('requiredAllowances')}
                                label="필요 배출권"
                                align="right"
                                extra={
                                    <InfoTooltip content="1 tCO₂e를 배출권 1개로 보고 연간 배출량을 올림 환산한 수량입니다." />
                                }
                            >
                                필요 배출권
                            </SortableHead>
                            <SortableHead
                                {...sort.getSortProps('estimatedAllowanceCostKrw')}
                                label="예상 배출권 비용"
                                align="right"
                                extra={
                                    <InfoTooltip
                                        content={`예상 배출권 비용 = 필요 배출권 × 선택 연도 배출권 단가입니다. 단가 미로드 시 기본값 ${formatEmissions(ALLOWANCE_PRICE_KRW_PER_TCO2E)}원/배출권을 사용하며, 무상할당·보유 배출권은 고려하지 않습니다.`}
                                    />
                                }
                            >
                                예상 비용
                            </SortableHead>
                            <SortableHead
                                {...sort.getSortProps('recentTrendPct')}
                                label="최근 추세"
                                align="center"
                                extra={
                                    <InfoTooltip content="선택 연도 기준 최신 3개월 평균 배출량과 직전 3개월 평균을 비교한 증감률입니다. 연간 성과가 아닌 최근 배출 모멘텀을 보여줍니다." />
                                }
                            >
                                최근 추세
                            </SortableHead>
                            <TableHead scope="col" className="py-3 pr-4 text-center">
                                <span className="inline-flex items-center gap-1">
                                    주요 Scope
                                    <InfoTooltip content="리스크 모델은 Scope 3 비중이 높을수록 공급망 관리 필요성이 크다고 보고 Scope 구성 점수를 높게 산정합니다." />
                                </span>
                            </TableHead>
                            <TableHead scope="col" className="py-3">
                                주요 정보
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sorted.map((assessment) => (
                            <RiskPriorityRow key={assessment.id} assessment={assessment} />
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
