'use client';

// 활동 데이터 Excel 임포트 다이얼로그
// BaseImportDialog를 사용하고 활동 데이터 전용 미리보기 테이블만 주입

import { BaseImportDialog } from '@/components/import/base-import-dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { SOURCE_LABELS } from '@/constants/ghg-scope';
import { useExcelImport } from '@/hooks/import/useExcelImport';
import { formatPcfEmissions, PCF_EMISSIONS_UNIT } from '@/lib/format';
import { readApiError } from '@/lib/api-fetch-error';
import type { ParsedActivityRow } from '@/types';

type Props = {
    open: boolean;
    onOpenChangeAction: (open: boolean) => void;
    defaultCompanyId?: string;
    fixedCompanyName?: string;
};

// 활동 데이터 Excel 파일을 미리보기 API에 전송해 파싱 결과 반환
async function fetchActivityPreview(
    file: File,
    signal: AbortSignal
): Promise<ParsedActivityRow[]> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/import/preview', { method: 'POST', body: formData, signal });
    if (!res.ok) {
        throw new Error(await readApiError(res, '파싱 실패'));
    }
    return res.json() as Promise<ParsedActivityRow[]>;
}

// 활동 데이터 미리보기 테이블 — 연월·활동유형·설명·량·단위·PCF 컬럼
function ActivityPreviewTable({ rows }: { rows: ParsedActivityRow[] }) {
    const totalPcfEmissions = rows.reduce((sum, r) => sum + r.emissionsKg, 0);

    return (
        <>
            <p className="text-muted-foreground mb-2 text-xs">
                {rows.length}행 파싱 완료 · 합계{' '}
                <span className="text-foreground font-medium">
                    {formatPcfEmissions(totalPcfEmissions)} {PCF_EMISSIONS_UNIT}
                </span>
            </p>
            <div className="border-border max-h-56 overflow-y-auto rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>연월</TableHead>
                            <TableHead>활동 유형</TableHead>
                            <TableHead>설명</TableHead>
                            <TableHead className="text-right">량</TableHead>
                            <TableHead>단위</TableHead>
                            <TableHead className="text-right">PCF 산정값</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rows.map((row, idx) => (
                            <TableRow key={idx}>
                                <TableCell className="font-mono text-xs">
                                    {row.yearMonth}
                                </TableCell>
                                <TableCell className="text-xs">{row.activityType}</TableCell>
                                <TableCell className="text-xs">{row.description}</TableCell>
                                <TableCell className="text-right text-xs">
                                    {row.quantity.toLocaleString()}
                                </TableCell>
                                <TableCell className="text-xs">{row.unit}</TableCell>
                                <TableCell className="text-right font-mono text-xs">
                                    {formatPcfEmissions(row.emissionsKg)}
                                    <span className="text-muted-foreground ml-1">
                                        {PCF_EMISSIONS_UNIT}
                                    </span>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
                * 배출원 코드:{' '}
                {[...new Set(rows.map((r) => r.source))]
                    .map((s) => `${SOURCE_LABELS[s] ?? s}(${s})`)
                    .join(', ')}
            </p>
        </>
    );
}

export function ExcelImportDialog({
    open,
    onOpenChangeAction,
    defaultCompanyId,
    fixedCompanyName,
}: Props) {
    const importMutation = useExcelImport(() => onOpenChangeAction(false));

    return (
        <BaseImportDialog<ParsedActivityRow>
            open={open}
            onOpenChangeAction={onOpenChangeAction}
            title="Excel 활동 데이터 임포트"
            description="과제 스펙 Excel(일자·활동유형·설명·량·단위)을 업로드하면 배출계수를 적용해 PostgreSQL에 저장합니다."
            defaultCompanyId={defaultCompanyId}
            fixedCompanyName={fixedCompanyName}
            onFetchPreviewAction={fetchActivityPreview}
            renderPreviewAction={(rows) => <ActivityPreviewTable rows={rows} />}
            onCommitAction={({ file, companyId }) =>
                importMutation.mutate({ file, companyId })
            }
            isCommitting={importMutation.isPending}
        />
    );
}
