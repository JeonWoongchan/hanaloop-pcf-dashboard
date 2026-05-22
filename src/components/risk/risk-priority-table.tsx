'use client';

// 회사별 리스크 우선순위 테이블 렌더링 (정렬 기능 포함)

import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { CardHeading } from '@/components/shared/card-heading';
import { InfoTooltip } from '@/components/shared/info-tooltip';
import { Card, CardContent } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCaption,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { CARBON_TAX_RATE_KRW_PER_TCO2E } from '@/constants/risk';
import { formatEmissions } from '@/lib/format';
import type { RiskAssessment, RiskLevel } from '@/lib/risk';
import { RiskPriorityRow } from './risk-priority-row';

type SortKey =
    | 'name'
    | 'score'
    | 'annualEmissions'
    | 'estimatedTaxKrw'
    | 'recentTrendPct'
    | 'level';
type SortDir = 'asc' | 'desc';

// RiskLevel 정렬 순서 매핑 (내림차순 기준: high가 가장 높음)
const LEVEL_ORDER: Record<RiskLevel, number> = { high: 3, medium: 2, low: 1 };

const ALIGN = {
    left: { head: '', flex: 'justify-start' },
    center: { head: 'text-center', flex: 'justify-center' },
    right: { head: 'text-right', flex: 'justify-end' },
} as const;

type SortableHeadProps = {
    sortKey: SortKey;
    currentKey: SortKey | null;
    direction: SortDir;
    onSort: (key: SortKey) => void;
    align?: keyof typeof ALIGN;
    extra?: React.ReactNode;
    children: React.ReactNode;
};

// 클릭 시 정렬 방향 토글, 활성 열에 방향 아이콘 표시
function SortableHead({
    sortKey,
    currentKey,
    direction,
    onSort,
    align = 'left',
    extra,
    children,
}: SortableHeadProps) {
    const isActive = currentKey === sortKey;
    const Icon = isActive ? (direction === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown;
    const { head, flex } = ALIGN[align];

    const ariaSort = isActive ? (direction === 'asc' ? 'ascending' : 'descending') : undefined;

    return (
        <TableHead
            scope="col"
            aria-sort={ariaSort}
            className={`text-muted-foreground py-3 pr-4 ${head}`}
        >
            <span className={`inline-flex w-full items-center gap-0.5 ${flex}`}>
                <button
                    type="button"
                    onClick={() => onSort(sortKey)}
                    className="hover:text-foreground inline-flex cursor-pointer items-center gap-1 transition-colors"
                >
                    {children}
                    <Icon className="size-3.5 shrink-0" aria-hidden />
                </button>
                {extra}
            </span>
        </TableHead>
    );
}

type Props = {
    assessments: RiskAssessment[];
    year: number;
};

export function RiskPriorityTable({ assessments, year }: Props) {
    const [sortKey, setSortKey] = useState<SortKey | null>(null);
    const [sortDir, setSortDir] = useState<SortDir>('desc');

    function handleSort(key: SortKey) {
        if (sortKey === key) {
            setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortKey(key);
            setSortDir('desc');
        }
    }

    // 정렬 기준·방향에 따라 assessments 복사 후 정렬
    const sorted = useMemo(() => {
        if (!sortKey) return assessments;
        return [...assessments].sort((a, b) => {
            let aVal: number;
            let bVal: number;

            if (sortKey === 'name') {
                const cmp = a.name.localeCompare(b.name, 'ko');
                return sortDir === 'asc' ? cmp : -cmp;
            }

            if (sortKey === 'level') {
                aVal = LEVEL_ORDER[a.level];
                bVal = LEVEL_ORDER[b.level];
            } else if (sortKey === 'recentTrendPct') {
                // null은 방향과 무관하게 항상 정렬 후미로 (-Infinity 치환 시 NaN 연산 발생)
                if (a.recentTrendPct === null && b.recentTrendPct === null) return 0;
                if (a.recentTrendPct === null) return 1;
                if (b.recentTrendPct === null) return -1;
                aVal = a.recentTrendPct;
                bVal = b.recentTrendPct;
            } else {
                aVal = a[sortKey];
                bVal = b[sortKey];
            }

            return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
        });
    }, [assessments, sortKey, sortDir]);

    return (
        <Card>
            <CardHeading
                title="관리 우선순위"
                tooltip="리스크 점수는 연간 배출량, 최근 3개월 증가 추세, Scope 구성을 종합해 산정합니다. 실제 규제 등급이 아니라 내부 판단용 지표입니다."
                description={`${year}년 기준 탄소세 노출액과 배출 증가 리스크가 큰 관리 대상 회사`}
            />
            <CardContent>
                <Table className="min-w-230">
                    <TableCaption className="sr-only">
                        {year}년 관리 대상 회사별 탄소세 리스크 우선순위
                    </TableCaption>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent">
                            <SortableHead
                                sortKey="name"
                                currentKey={sortKey}
                                direction={sortDir}
                                onSort={handleSort}
                            >
                                회사
                            </SortableHead>
                            <SortableHead
                                sortKey="level"
                                currentKey={sortKey}
                                direction={sortDir}
                                onSort={handleSort}
                                align="center"
                            >
                                등급
                            </SortableHead>
                            <SortableHead
                                sortKey="score"
                                currentKey={sortKey}
                                direction={sortDir}
                                onSort={handleSort}
                                align="center"
                            >
                                점수
                            </SortableHead>
                            <SortableHead
                                sortKey="annualEmissions"
                                currentKey={sortKey}
                                direction={sortDir}
                                onSort={handleSort}
                                align="right"
                            >
                                연간 배출량
                            </SortableHead>
                            <SortableHead
                                sortKey="estimatedTaxKrw"
                                currentKey={sortKey}
                                direction={sortDir}
                                onSort={handleSort}
                                align="right"
                                extra={
                                    <InfoTooltip
                                        content={`예상 비용 = 선택 연도 연간 배출량 × 가정 세율(${formatEmissions(CARBON_TAX_RATE_KRW_PER_TCO2E)}원/tCO₂e)입니다. 실제 세무·법률 산정이 아니라 관리 우선순위 판단을 위한 시나리오입니다.`}
                                    />
                                }
                            >
                                예상 비용
                            </SortableHead>
                            <SortableHead
                                sortKey="recentTrendPct"
                                currentKey={sortKey}
                                direction={sortDir}
                                onSort={handleSort}
                                align="center"
                                extra={
                                    <InfoTooltip content="최근 3개월 평균 배출량과 그 직전 3개월 평균을 비교한 증감률입니다. 연간 성과가 아닌 지금 이 순간의 배출 모멘텀을 나타내며, 대시보드의 전년 동기 비교와 기준이 다릅니다." />
                                }
                            >
                                최근 추세
                            </SortableHead>
                            <TableHead
                                scope="col"
                                className="text-muted-foreground py-3 pr-4 text-center"
                            >
                                <span className="inline-flex items-center gap-0.5">
                                    주요 Scope
                                    <InfoTooltip content="Scope 3(공급망·운송·출장)은 자사가 직접 통제할 수 없는 배출이라 감축 난이도가 가장 높습니다. 리스크 점수의 Scope 구성 항목(20점)은 Scope 3 비중이 높을수록 높게 산정됩니다." />
                                </span>
                            </TableHead>
                            <TableHead scope="col" className="text-muted-foreground py-3">
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
