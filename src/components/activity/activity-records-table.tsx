'use client';

import { useMemo } from 'react';
import { CardHeading } from '@/components/shared/card-heading';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { SortableHead } from '@/components/shared/sortable-head';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { SCOPE_LABELS } from '@/constants/ghg-scope';
import {
    compareByDirection,
    sortByState,
    useSort,
    type SortComparators,
} from '@/hooks/shared/useSort';
import { useActivityRecords, useDeleteActivityRecord } from '@/hooks/activity-records/useActivityRecords';
import { DeleteConfirmButton } from '@/components/shared/delete-confirm-button';
import { filterActivityRecordsByYear } from '@/lib/emissions';
import type { ActivityRecord } from '@/types';

type SortKey = 'activityDate' | 'activityType' | 'emissionsKg';

const INTERNAL_SCROLL_ROW_THRESHOLD = 10;
const TABLE_MIN_WIDTH_CLASS = 'min-w-[1100px]';
const STICKY_HEADER_CLASS = 'sticky top-0 z-10 bg-card';

const SCOPE_BADGE_CLASS_NAMES: Record<1 | 2 | 3, string> = {
    1: 'border-transparent bg-[var(--scope-1-shade-1)]/15 text-[var(--scope-1-shade-1)]',
    2: 'border-transparent bg-[var(--scope-2-shade-1)]/15 text-[var(--scope-2-shade-1)]',
    3: 'border-transparent bg-[var(--scope-3-shade-1)]/15 text-[var(--scope-3-shade-1)]',
};

const SORT_COMPARATORS: SortComparators<ActivityRecord, SortKey> = {
    activityDate: (a, b, direction) =>
        compareByDirection(a.activityDate.localeCompare(b.activityDate), direction),
    activityType: (a, b, direction) =>
        compareByDirection(a.activityType.localeCompare(b.activityType, 'ko'), direction),
    emissionsKg: (a, b, direction) => compareByDirection(a.emissionsKg - b.emissionsKg, direction),
};

function ScopeBadge({ scope }: { scope: 1 | 2 | 3 }) {
    return (
        <Badge variant="outline" className={SCOPE_BADGE_CLASS_NAMES[scope]}>
            {SCOPE_LABELS[scope]}
        </Badge>
    );
}

function TableSkeleton() {
    return (
        <div className="space-y-2">
            {Array.from({ length: 5 }, (_, i) => (
                <Skeleton key={i} className="h-9 w-full rounded-md" />
            ))}
        </div>
    );
}

type Props = {
    companyId: string;
    year?: number;
};

export function ActivityRecordsTable({ companyId, year }: Props) {
    const { data: records, isLoading, error, refetch } = useActivityRecords(companyId);
    const deleteMutation = useDeleteActivityRecord(companyId);
    const sort = useSort<SortKey>({ initialKey: 'activityDate', initialDirection: 'desc' });

    const filteredRecords = useMemo(
        () => (year ? filterActivityRecordsByYear(records ?? [], year) : (records ?? [])),
        [records, year]
    );

    const sorted = useMemo(
        () =>
            sortByState(
                filteredRecords,
                { sortKey: sort.sortKey, sortDir: sort.sortDir },
                SORT_COMPARATORS
            ),
        [filteredRecords, sort.sortKey, sort.sortDir]
    );
    const shouldUseInternalScroll = sorted.length > INTERNAL_SCROLL_ROW_THRESHOLD;
    const tableContainerClassName = shouldUseInternalScroll
        ? 'max-h-[520px] overflow-auto'
        : 'overflow-x-auto';
    const stickyHeaderClassName = shouldUseInternalScroll ? STICKY_HEADER_CLASS : undefined;

    return (
        <Card>
            <CardHeading
                title="원본 활동 데이터"
                description="Excel 업로드로 등록한 PCF 산정 기초 데이터입니다. 배출계수는 업로드 시점에 적용된 값을 표시합니다."
                tooltip="GHG 배출량 집계 차트와 별개로 활동 단위(kWh, kg, ton-km)를 기준으로 배출량을 추적할 수 있는 원본 데이터입니다."
            />
            <CardContent>
                {isLoading && <TableSkeleton />}
                {error && (
                    <ErrorState
                        message="활동 데이터를 불러오지 못했습니다."
                        onRetry={() => void refetch()}
                    />
                )}
                {!isLoading && !error && sorted.length === 0 && (
                    <EmptyState message="업로드된 활동 데이터가 없습니다. 회사 목록 페이지에서 Excel 업로드 기능을 사용해 데이터를 추가할 수 있습니다." />
                )}
                {!isLoading && !error && sorted.length > 0 && (
                    <div className={tableContainerClassName}>
                        <Table className={TABLE_MIN_WIDTH_CLASS}>
                            <TableCaption className="sr-only">
                                원본 활동 데이터 {sorted.length}건
                            </TableCaption>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent">
                                    <SortableHead
                                        {...sort.getSortProps('activityDate')}
                                        label="일자"
                                        className={stickyHeaderClassName}
                                    >
                                        일자
                                    </SortableHead>
                                    <SortableHead
                                        {...sort.getSortProps('activityType')}
                                        label="활동 유형"
                                        className={stickyHeaderClassName}
                                    >
                                        활동 유형
                                    </SortableHead>
                                    <TableHead
                                        className={`${stickyHeaderClassName ?? ''} py-3 pr-4`}
                                    >
                                        설명
                                    </TableHead>
                                    <TableHead
                                        className={`${stickyHeaderClassName ?? ''} py-3 pr-4 text-right`}
                                    >
                                        수량
                                    </TableHead>
                                    <TableHead
                                        className={`${stickyHeaderClassName ?? ''} py-3 pr-4`}
                                    >
                                        단위
                                    </TableHead>
                                    <TableHead
                                        className={`${stickyHeaderClassName ?? ''} py-3 pr-4`}
                                    >
                                        source
                                    </TableHead>
                                    <TableHead
                                        className={`${stickyHeaderClassName ?? ''} py-3 pr-4 text-center`}
                                    >
                                        scope
                                    </TableHead>
                                    <TableHead
                                        className={`${stickyHeaderClassName ?? ''} py-3 pr-4 text-right`}
                                    >
                                        배출계수
                                    </TableHead>
                                    <SortableHead
                                        {...sort.getSortProps('emissionsKg')}
                                        label="kgCO₂e"
                                        align="right"
                                        className={stickyHeaderClassName}
                                    >
                                        kgCO₂e
                                    </SortableHead>
                                    <TableHead
                                        className={`${stickyHeaderClassName ?? ''} py-3 pr-4 text-right`}
                                    >
                                        tCO₂e
                                    </TableHead>
                                    <TableHead
                                        className={`${stickyHeaderClassName ?? ''} py-3 pr-4`}
                                    >
                                        파일명
                                    </TableHead>
                                    <TableHead
                                        className={`${stickyHeaderClassName ?? ''} py-3 text-right`}
                                    >
                                        행
                                    </TableHead>
                                    <TableHead
                                        className={`${stickyHeaderClassName ?? ''} w-10 py-3`}
                                    />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sorted.map((rec) => (
                                    <TableRow key={rec.id}>
                                        <TableCell className="font-mono text-xs">
                                            {rec.activityDate}
                                        </TableCell>
                                        <TableCell className="text-xs">
                                            {rec.activityType}
                                        </TableCell>
                                        <TableCell className="text-xs">{rec.description}</TableCell>
                                        <TableCell className="text-right text-xs">
                                            {rec.quantity.toLocaleString()}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-xs">
                                            {rec.unit}
                                        </TableCell>
                                        <TableCell className="font-mono text-xs">
                                            {rec.source}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <ScopeBadge scope={rec.scope} />
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-right text-xs">
                                            {rec.emissionFactorKg.toLocaleString()}
                                        </TableCell>
                                        <TableCell className="text-right text-xs font-medium">
                                            {rec.emissionsKg.toLocaleString(undefined, {
                                                maximumFractionDigits: 4,
                                            })}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-right text-xs">
                                            {rec.emissionsTco2e.toLocaleString(undefined, {
                                                maximumFractionDigits: 4,
                                            })}
                                        </TableCell>
                                        <TableCell
                                            className="text-muted-foreground max-w-32 truncate text-xs"
                                            title={rec.importFileName ?? undefined}
                                        >
                                            {rec.importFileName ?? '-'}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-right text-xs">
                                            {rec.importRowNumber ?? '-'}
                                        </TableCell>
                                        <TableCell className="py-2 text-right">
                                            <DeleteConfirmButton
                                                onConfirmAction={() =>
                                                    deleteMutation.mutate(rec.id)
                                                }
                                                disabled={
                                                    deleteMutation.isPending &&
                                                    deleteMutation.variables === rec.id
                                                }
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
