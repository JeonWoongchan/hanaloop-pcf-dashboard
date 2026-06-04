'use client';

// GHG 배출량 Excel 임포트 다이얼로그
// BaseImportDialog를 사용하고 GHG 전용 미리보기 테이블만 주입

import { BaseImportDialog } from '@/components/import/base-import-dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { SCOPE_LABELS, SCOPE_MAP, SOURCE_LABELS } from '@/constants/ghg-scope';
import { useGhgImport } from '@/hooks/import/useGhgImport';
import { formatEmissions } from '@/lib/format';
import type { ParsedGhgRow } from '@/types';

type Props = {
    open: boolean;
    onOpenChangeAction: (open: boolean) => void;
    defaultCompanyId?: string;
    fixedCompanyName?: string;
};

// GHG Excel 파일을 미리보기 API에 전송해 파싱 결과 반환
async function fetchGhgPreview(file: File, signal: AbortSignal): Promise<ParsedGhgRow[]> {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/api/ghg-emissions/import/preview', {
        method: 'POST',
        body: formData,
        signal,
    });

    if (!res.ok) {
        const isJson = res.headers.get('content-type')?.includes('application/json');
        const body = isJson ? ((await res.json()) as { error?: string }) : {};
        throw new Error(body.error ?? '파싱 실패');
    }

    return res.json() as Promise<ParsedGhgRow[]>;
}

// GHG 미리보기 테이블 — yearMonth·배출원·Scope·배출량 컬럼
function GhgPreviewTable({ rows }: { rows: ParsedGhgRow[] }) {
    const totalEmissions = rows.reduce((sum, r) => sum + r.emissions, 0);

    return (
        <>
            <p className="text-muted-foreground mb-2 text-xs">
                {rows.length}행 파싱 완료 · 합계{' '}
                <span className="text-foreground font-medium">
                    {formatEmissions(totalEmissions)} tCO₂e
                </span>
            </p>
            <div className="border-border max-h-56 overflow-y-auto rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>연월</TableHead>
                            <TableHead>배출원</TableHead>
                            <TableHead>Scope</TableHead>
                            <TableHead className="text-right">배출량 (tCO₂e)</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rows.map((row, idx) => {
                            const scope = SCOPE_MAP[row.source];
                            return (
                                <TableRow key={idx}>
                                    <TableCell className="font-mono text-xs">
                                        {row.yearMonth}
                                    </TableCell>
                                    <TableCell className="text-xs">
                                        {SOURCE_LABELS[row.source] ?? row.source}
                                    </TableCell>
                                    <TableCell className="text-xs">
                                        {scope ? SCOPE_LABELS[scope] : '-'}
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-xs">
                                        {formatEmissions(row.emissions)}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>
        </>
    );
}

export function GhgImportDialog({
    open,
    onOpenChangeAction,
    defaultCompanyId,
    fixedCompanyName,
}: Props) {
    const importMutation = useGhgImport(() => onOpenChangeAction(false));

    return (
        <BaseImportDialog<ParsedGhgRow>
            open={open}
            onOpenChangeAction={onOpenChangeAction}
            title="Excel GHG 배출량 임포트"
            description="연월·배출원·배출량(tCO₂e) 3개 컬럼으로 구성된 Excel 파일을 업로드하세요. 동일한 연월·배출원 조합은 덮어씁니다."
            defaultCompanyId={defaultCompanyId}
            fixedCompanyName={fixedCompanyName}
            onFetchPreview={fetchGhgPreview}
            renderPreview={(rows) => <GhgPreviewTable rows={rows} />}
            onCommit={({ file, companyId }) => importMutation.mutate({ file, companyId })}
            isCommitting={importMutation.isPending}
        />
    );
}
