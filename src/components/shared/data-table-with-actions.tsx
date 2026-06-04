'use client';

// 행 단위 수정·삭제 액션이 있는 공통 테이블 컴포넌트
// ActivityRecord, GhgEmission 등 도메인별 컬럼 정의를 주입해서 재사용

import { Pencil } from 'lucide-react';
import { CardHeading } from '@/components/shared/card-heading';
import { DeleteConfirmButton } from '@/components/shared/delete-confirm-button';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { Button } from '@/components/ui/button';
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
import { cn } from '@/lib/utils';

// 10행 초과 시 테이블 내부 스크롤 적용
const INTERNAL_SCROLL_ROW_THRESHOLD = 10;

export type ColumnDef<T> = {
    key: string;
    header: React.ReactNode;
    headerClassName?: string;
    cellClassName?: string;
    render: (row: T) => React.ReactNode;
};

type Props<T extends { id: string }> = {
    title: string;
    description?: string;
    tooltip?: string;
    caption?: string;
    columns: ColumnDef<T>[];
    data: T[];
    isLoading?: boolean;
    error?: Error | null;
    emptyMessage?: string;
    minWidthClass?: string;
    onDelete?: (id: string) => void;
    isDeletingId?: string | null;
    onEdit?: (row: T) => void;
    onRetry?: () => void;
};

function TableSkeleton() {
    return (
        <div className="space-y-2">
            {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="h-9 w-full rounded-md" />
            ))}
        </div>
    );
}


export function DataTableWithActions<T extends { id: string }>({
    title,
    description,
    tooltip,
    caption,
    columns,
    data,
    isLoading,
    error,
    emptyMessage = '데이터가 없습니다.',
    minWidthClass,
    onDelete,
    isDeletingId,
    onEdit,
    onRetry,
}: Props<T>) {
    const hasActions = Boolean(onDelete ?? onEdit);
    const useInternalScroll = data.length > INTERNAL_SCROLL_ROW_THRESHOLD;

    return (
        <Card>
            <CardHeading title={title} description={description} tooltip={tooltip} />
            <CardContent>
                {isLoading && <TableSkeleton />}
                {error && (
                    <ErrorState
                        message="데이터를 불러오지 못했습니다."
                        onRetry={onRetry ? () => void onRetry() : undefined}
                    />
                )}
                {!isLoading && !error && data.length === 0 && (
                    <EmptyState message={emptyMessage} />
                )}
                {!isLoading && !error && data.length > 0 && (
                    <div
                        className={cn(
                            'overflow-x-auto',
                            useInternalScroll && 'max-h-[520px] overflow-auto'
                        )}
                    >
                        <Table className={minWidthClass}>
                            {caption && (
                                <TableCaption className="sr-only">{caption}</TableCaption>
                            )}
                            <TableHeader>
                                <TableRow className="hover:bg-transparent">
                                    {columns.map((col) => (
                                        <TableHead
                                            key={col.key}
                                            className={cn('py-3 pr-4', col.headerClassName)}
                                        >
                                            {col.header}
                                        </TableHead>
                                    ))}
                                    {hasActions && (
                                        <TableHead className="w-24 py-3 text-right">
                                            작업
                                        </TableHead>
                                    )}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.map((row) => (
                                    <TableRow key={row.id}>
                                        {columns.map((col) => (
                                            <TableCell
                                                key={col.key}
                                                className={cn('py-3 pr-4', col.cellClassName)}
                                            >
                                                {col.render(row)}
                                            </TableCell>
                                        ))}
                                        {hasActions && (
                                            <TableCell className="py-2 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    {onEdit && (
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="text-muted-foreground hover:text-foreground size-7"
                                                            onClick={() => onEdit(row)}
                                                            aria-label="행 수정"
                                                        >
                                                            <Pencil className="size-3.5" />
                                                        </Button>
                                                    )}
                                                    {onDelete && (
                                                        <DeleteConfirmButton
                                                            onConfirm={() => onDelete(row.id)}
                                                            disabled={isDeletingId === row.id}
                                                        />
                                                    )}
                                                </div>
                                            </TableCell>
                                        )}
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
