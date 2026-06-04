'use client';

import { useCallback, useRef, useState } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useCompanies } from '@/hooks/companies/useCompanies';
import { useExcelImport } from '@/hooks/import/useExcelImport';
import { SOURCE_LABELS } from '@/constants/ghg-scope';
import { formatPcfEmissions, PCF_EMISSIONS_UNIT } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { ParsedActivityRow } from '@/types';

const ALLOWED_EXTENSIONS = ['.xlsx', '.xls'];
const INVALID_FIELD_CLASS = 'border-destructive ring-destructive/20 ring-3';
const COMPANY_ERROR_ID = 'excel-company-error';

type Props = {
    open: boolean;
    onOpenChangeAction: (open: boolean) => void;
    defaultCompanyId?: string;
    fixedCompanyName?: string;
};


export function ExcelImportDialog({
    open,
    onOpenChangeAction,
    defaultCompanyId,
    fixedCompanyName,
}: Props) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    // 진행 중인 preview 요청을 취소하기 위한 AbortController 참조
    const abortRef = useRef<AbortController | null>(null);

    const [isDragging, setIsDragging] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<ParsedActivityRow[] | null>(null);
    const [previewError, setPreviewError] = useState<string | null>(null);
    const [isPreviewing, setIsPreviewing] = useState(false);
    const [selectedCompanyId, setSelectedCompanyId] = useState('');
    const [companyError, setCompanyError] = useState<string | undefined>();

    const { data: companies } = useCompanies();

    const isCompanyFixed = Boolean(defaultCompanyId);
    const targetCompanyId = defaultCompanyId ?? selectedCompanyId;
    const uploadHasError = Boolean(previewError);

    const reset = useCallback(() => {
        abortRef.current?.abort();
        abortRef.current = null;
        setFile(null);
        setPreview(null);
        setPreviewError(null);
        setIsPreviewing(false);
        setSelectedCompanyId('');
        setCompanyError(undefined);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }, []);

    const handleOpenChange = (v: boolean) => {
        if (!v) reset();
        onOpenChangeAction(v);
    };

    // reset/handleOpenChange 이후에 선언 — onSuccess에서 handleOpenChange(false) 호출 시 reset()도 실행됨
    const importMutation = useExcelImport(() => handleOpenChange(false));

    const fetchPreview = useCallback(async (f: File) => {
        // 이전 요청 취소 후 새 컨트롤러 발급 — 파일 교체 시 경쟁 응답 방지
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        setIsPreviewing(true);
        setPreviewError(null);
        setPreview(null);
        try {
            const fd = new FormData();
            fd.append('file', f);
            const res = await fetch('/api/import/preview', {
                method: 'POST',
                body: fd,
                signal: controller.signal,
            });
            if (!res.ok) {
                const isJson = res.headers.get('content-type')?.includes('application/json');
                const body = isJson ? ((await res.json()) as { error?: string }) : {};
                setPreviewError(body.error ?? '파싱 실패');
            } else {
                setPreview((await res.json()) as ParsedActivityRow[]);
            }
        } catch (err) {
            // AbortError는 정상적인 취소이므로 에러 표시 생략
            if (err instanceof DOMException && err.name === 'AbortError') return;
            setPreviewError('파일 파싱에 실패했습니다.');
        } finally {
            setIsPreviewing(false);
        }
    }, []);

    const handleFileSelect = useCallback(
        (f: File) => {
            const isAllowed = ALLOWED_EXTENSIONS.some((ext) => f.name.toLowerCase().endsWith(ext));
            if (!isAllowed) {
                setPreviewError('.xlsx 또는 .xls 파일만 업로드할 수 있습니다.');
                return;
            }
            setFile(f);
            void fetchPreview(f);
        },
        [fetchPreview]
    );

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setIsDragging(false);
            const dropped = e.dataTransfer.files[0];
            if (dropped) handleFileSelect(dropped);
        },
        [handleFileSelect]
    );

    const handleImport = () => {
        if (!file) return;
        if (!isCompanyFixed && !selectedCompanyId) {
            setCompanyError('대상 회사를 선택해 주세요.');
            return;
        }
        importMutation.mutate({ file, companyId: targetCompanyId });
    };

    const totalPcfEmissions = preview?.reduce((sum, r) => sum + r.emissionsKg, 0) ?? 0;

    // isPreviewing 포함 — 이전 파일의 preview가 state에 남아있는 동안 제출 차단
    const canImport =
        file !== null &&
        preview !== null &&
        previewError === null &&
        !isPreviewing &&
        (isCompanyFixed ? Boolean(defaultCompanyId) : selectedCompanyId.length > 0);

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="flex max-h-[90vh] max-w-3xl flex-col gap-0 p-0">
                <DialogHeader className="px-6 pt-6 pb-4">
                    <DialogTitle>Excel 활동 데이터 임포트</DialogTitle>
                    <p className="text-muted-foreground text-sm">
                        과제 스펙 Excel(일자·활동유형·설명·량·단위)을 업로드하면 배출계수를 적용해
                        DB에 등록된 배출계수 버전을 적용한 뒤 저장합니다.
                    </p>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-6 pb-2">
                    {/* 파일 업로드 영역 */}
                    <div
                        className={cn(
                            'relative mb-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 transition-colors',
                            isDragging
                                ? 'border-primary bg-accent'
                                : 'border-border hover:border-primary hover:bg-accent/50',
                            uploadHasError && 'border-destructive bg-destructive/5'
                        )}
                        onDragOver={(e) => {
                            e.preventDefault();
                            setIsDragging(true);
                        }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        role="button"
                        aria-label="Excel 파일 업로드"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".xlsx,.xls"
                            className="hidden"
                            onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) handleFileSelect(f);
                            }}
                        />
                        {file ? (
                            <>
                                <FileSpreadsheet className="text-primary h-8 w-8" />
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium">{file.name}</span>
                                    <button
                                        type="button"
                                        aria-label="파일 제거"
                                        className="text-muted-foreground hover:text-foreground"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            reset();
                                        }}
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <Upload className="text-muted-foreground h-8 w-8" />
                                <p className="text-muted-foreground text-sm">
                                    .xlsx / .xls 파일을 드래그하거나 클릭해 선택하세요
                                </p>
                            </>
                        )}
                    </div>

                    {/* 미리보기 스켈레톤 */}
                    {isPreviewing && (
                        <div className="mb-4 space-y-2">
                            {[...Array(3)].map((_, i) => (
                                <Skeleton key={i} className="h-8 w-full rounded-md" />
                            ))}
                        </div>
                    )}

                    {previewError && (
                        <div className="bg-destructive/10 text-destructive mb-4 flex items-center gap-2 rounded-md px-3 py-2 text-sm">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            {previewError}
                        </div>
                    )}

                    {preview && preview.length > 0 && (
                        <div className="mb-4">
                            <p className="text-muted-foreground mb-2 text-xs">
                                {preview.length}행 파싱 완료 · 합계{' '}
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
                                            <TableHead className="text-right">
                                                PCF 산정값
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {preview.map((row, idx) => (
                                            <TableRow key={idx}>
                                                <TableCell className="font-mono text-xs">
                                                    {row.yearMonth}
                                                </TableCell>
                                                <TableCell className="text-xs">
                                                    {row.activityType}
                                                </TableCell>
                                                <TableCell className="text-xs">
                                                    {row.description}
                                                </TableCell>
                                                <TableCell className="text-right text-xs">
                                                    {row.quantity.toLocaleString()}
                                                </TableCell>
                                                <TableCell className="text-xs">
                                                    {row.unit}
                                                </TableCell>
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
                                {[...new Set(preview.map((r) => r.source))]
                                    .map((s) => `${SOURCE_LABELS[s] ?? s}(${s})`)
                                    .join(', ')}
                            </p>
                        </div>
                    )}

                    {/* 대상 회사 선택 */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">대상 회사</label>
                        {isCompanyFixed ? (
                            <div className="border-border bg-muted/40 text-foreground rounded-md border px-3 py-2 text-sm font-medium">
                                {fixedCompanyName ?? '현재 회사'}
                            </div>
                        ) : (
                            <>
                                <Select
                                    value={selectedCompanyId}
                                    onValueChange={(v) => {
                                        setSelectedCompanyId(v);
                                        setCompanyError(undefined);
                                    }}
                                >
                                    <SelectTrigger
                                        className={cn(
                                            'w-full',
                                            companyError && INVALID_FIELD_CLASS
                                        )}
                                        aria-invalid={Boolean(companyError)}
                                        aria-describedby={
                                            companyError ? COMPANY_ERROR_ID : undefined
                                        }
                                    >
                                        <SelectValue placeholder="회사를 선택하세요" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {companies?.map((c) => (
                                            <SelectItem key={c.id} value={c.id}>
                                                {c.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {companyError && (
                                    <p id={COMPANY_ERROR_ID} className="text-destructive text-xs">
                                        {companyError}
                                    </p>
                                )}
                            </>
                        )}
                    </div>
                </div>

                <DialogFooter className="mx-0 mb-0 rounded-b-xl px-6 py-4">
                    <Button variant="outline" onClick={() => handleOpenChange(false)}>
                        취소
                    </Button>
                    <Button
                        disabled={!canImport || importMutation.isPending}
                        onClick={handleImport}
                    >
                        {importMutation.isPending ? '임포트 중…' : '임포트'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
