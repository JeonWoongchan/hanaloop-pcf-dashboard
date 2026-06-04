'use client';

// GHG 배출량 테이블 — 행 단위 수정·삭제 포함

import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { DataTableWithActions, type ColumnDef } from '@/components/shared/data-table-with-actions';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { SCOPE_LABELS, SCOPE_MAP, SOURCE_LABELS } from '@/constants/ghg-scope';
import {
    useDeleteGhgEmission,
    useGhgEmissions,
    useUpdateGhgEmission,
} from '@/hooks/ghg-emissions/useGhgEmissions';
import { formatEmissions } from '@/lib/format';
import type { GhgEmissionRecord } from '@/types';

const VALID_SOURCES = Object.keys(SCOPE_MAP);

type EditFormValues = {
    yearMonth: string;
    source: string;
    emissions: string; // input은 string으로 받아 변환
};

type EditDialogProps = {
    open: boolean;
    onOpenChangeAction: (open: boolean) => void;
    record: GhgEmissionRecord;
    companyId: string;
};

function GhgEditDialog({ open, onOpenChangeAction, record, companyId }: EditDialogProps) {
    const updateMutation = useUpdateGhgEmission(companyId, () => onOpenChangeAction(false));

    const {
        register,
        handleSubmit,
        control,
        formState: { errors },
    } = useForm<EditFormValues>({
        defaultValues: {
            yearMonth: record.yearMonth,
            source: record.source,
            emissions: String(record.emissions),
        },
    });

    const onSubmit = (values: EditFormValues) => {
        updateMutation.mutate({
            id: record.id,
            payload: {
                yearMonth: values.yearMonth,
                source: values.source,
                emissions: Number(values.emissions),
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChangeAction}>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle>GHG 배출량 수정</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-1.5">
                        <label htmlFor="ghg-year-month" className="text-sm font-medium">
                            연월
                        </label>
                        <Input
                            id="ghg-year-month"
                            placeholder="YYYY-MM"
                            {...register('yearMonth', {
                                required: '연월을 입력해 주세요.',
                                pattern: {
                                    value: /^\d{4}-\d{2}$/,
                                    message: 'YYYY-MM 형식으로 입력해 주세요.',
                                },
                            })}
                        />
                        {errors.yearMonth && (
                            <p className="text-destructive text-xs">{errors.yearMonth.message}</p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <label htmlFor="ghg-source" className="text-sm font-medium">
                            배출원
                        </label>
                        <Controller
                            control={control}
                            name="source"
                            rules={{ required: '배출원을 선택해 주세요.' }}
                            render={({ field }) => (
                                <Select value={field.value} onValueChange={field.onChange}>
                                    <SelectTrigger id="ghg-source">
                                        <SelectValue placeholder="배출원 선택" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {VALID_SOURCES.map((s) => (
                                            <SelectItem key={s} value={s}>
                                                {SOURCE_LABELS[s] ?? s}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                        {errors.source && (
                            <p className="text-destructive text-xs">{errors.source.message}</p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <label htmlFor="ghg-emissions" className="text-sm font-medium">
                            배출량 (tCO₂e)
                        </label>
                        <Input
                            id="ghg-emissions"
                            type="number"
                            step="any"
                            min="0"
                            placeholder="0.00"
                            {...register('emissions', {
                                required: '배출량을 입력해 주세요.',
                                validate: (v) =>
                                    Number(v) > 0 || '배출량은 0보다 커야 합니다.',
                            })}
                        />
                        {errors.emissions && (
                            <p className="text-destructive text-xs">{errors.emissions.message}</p>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChangeAction(false)}
                        >
                            취소
                        </Button>
                        <Button type="submit" disabled={updateMutation.isPending}>
                            {updateMutation.isPending ? '저장 중…' : '수정'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

// GhgEmissionRecord 컬럼 정의
const COLUMNS: ColumnDef<GhgEmissionRecord>[] = [
    {
        key: 'yearMonth',
        header: '연월',
        cellClassName: 'font-mono text-xs',
        render: (r) => r.yearMonth,
    },
    {
        key: 'source',
        header: '배출원',
        cellClassName: 'text-xs',
        render: (r) => SOURCE_LABELS[r.source] ?? r.source,
    },
    {
        key: 'scope',
        header: 'Scope',
        cellClassName: 'text-xs',
        render: (r) => {
            const scope = SCOPE_MAP[r.source];
            return scope ? SCOPE_LABELS[scope] : '-';
        },
    },
    {
        key: 'emissions',
        header: '배출량 (tCO₂e)',
        headerClassName: 'text-right',
        cellClassName: 'text-right font-mono text-xs',
        render: (r) => formatEmissions(r.emissions),
    },
];

type Props = {
    companyId: string;
    year?: number;
};

export function GhgEmissionsTable({ companyId, year }: Props) {
    const { data, isLoading, error, refetch } = useGhgEmissions(companyId);
    const deleteMutation = useDeleteGhgEmission(companyId);
    const [editTarget, setEditTarget] = useState<GhgEmissionRecord | null>(null);

    const filtered = year
        ? (data ?? []).filter((r) => r.yearMonth.startsWith(String(year)))
        : (data ?? []);

    return (
        <>
            {editTarget && (
                <GhgEditDialog
                    open={Boolean(editTarget)}
                    onOpenChangeAction={(open) => !open && setEditTarget(null)}
                    record={editTarget}
                    companyId={companyId}
                />
            )}
            <DataTableWithActions<GhgEmissionRecord>
                title="GHG 배출량 데이터"
                description="GHG 배출량 데이터입니다. 수정·삭제 후 변경 내용은 즉시 반영됩니다."
                tooltip="ghg_emissions 테이블의 원본 행입니다. Excel 임포트로 추가하거나 행 단위로 수정·삭제할 수 있습니다."
                caption={`GHG 배출량 ${filtered.length}건`}
                columns={COLUMNS}
                data={filtered}
                isLoading={isLoading}
                error={error}
                emptyMessage="GHG 배출량 데이터가 없습니다. Excel 임포트로 데이터를 추가할 수 있습니다."
                onDeleteAction={(id) => deleteMutation.mutate(id)}
                isDeletingIdAction={deleteMutation.isPending ? deleteMutation.variables : null}
                onEditAction={(row) => setEditTarget(row)}
                onRetryAction={() => void refetch()}
            />
        </>
    );
}
