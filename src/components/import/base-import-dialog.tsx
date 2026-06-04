'use client';

// 파일 업로드·미리보기·회사 선택·확인 공통 뼈대
// 도메인별 import dialog는 이 컴포넌트를 사용하고 renderPreview만 교체

import { useCallback, useRef, useState } from 'react';
import { AlertCircle, FileSpreadsheet, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useCompanies } from '@/hooks/companies/useCompanies';
import { cn } from '@/lib/utils';

const ALLOWED_EXTENSIONS = ['.xlsx', '.xls'];
const INVALID_FIELD_CLASS = 'border-destructive ring-destructive/20 ring-3';

type Props<TPreview> = {
    open: boolean;
    onOpenChangeAction: (open: boolean) => void;
    title: string;
    description: string;
    // 회사 상세에서 열면 해당 회사로 고정
    defaultCompanyId?: string;
    fixedCompanyName?: string;
    // 파일을 받아 미리보기 데이터를 반환 — 도메인별로 다른 엔드포인트 사용
    onFetchPreviewAction: (file: File, signal: AbortSignal) => Promise<TPreview[]>;
    // 미리보기 테이블·요약 렌더링 — 도메인별로 컬럼이 다름
    renderPreviewAction: (rows: TPreview[]) => React.ReactNode;
    onCommitAction: (params: { file: File; companyId: string }) => void;
    isCommitting: boolean;
};

function ErrorMessage({ children }: { children: string }) {
    return <p className="text-destructive mt-1 text-xs">{children}</p>;
}

export function BaseImportDialog<TPreview>({
    open,
    onOpenChangeAction,
    title,
    description,
    defaultCompanyId,
    fixedCompanyName,
    onFetchPreviewAction,
    renderPreviewAction,
    onCommitAction,
    isCommitting,
}: Props<TPreview>) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    // 진행 중인 preview 요청을 취소하기 위한 AbortController 참조
    const abortRef = useRef<AbortController | null>(null);

    const [isDragging, setIsDragging] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<TPreview[] | null>(null);
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

    const handleOpenChange = useCallback(
        (v: boolean) => {
            if (!v) reset();
            onOpenChangeAction(v);
        },
        [reset, onOpenChangeAction]
    );

    const fetchPreview = useCallback(
        async (f: File) => {
            // 이전 요청 취소 후 새 컨트롤러 발급 — 파일 교체 시 경쟁 응답 방지
            abortRef.current?.abort();
            const controller = new AbortController();
            abortRef.current = controller;

            setIsPreviewing(true);
            setPreviewError(null);
            setPreview(null);
            try {
                const rows = await onFetchPreviewAction(f, controller.signal);
                setPreview(rows);
            } catch (err) {
                // AbortError는 정상적인 취소이므로 에러 표시 생략
                if (err instanceof DOMException && err.name === 'AbortError') return;
                const message =
                    err instanceof Error ? err.message : '파일 파싱에 실패했습니다.';
                setPreviewError(message);
            } finally {
                setIsPreviewing(false);
            }
        },
        [onFetchPreviewAction]
    );

    const handleFileSelect = useCallback(
        (f: File) => {
            const isAllowed = ALLOWED_EXTENSIONS.some((ext) =>
                f.name.toLowerCase().endsWith(ext)
            );
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

    const handleCommit = () => {
        if (!file) return;
        if (!isCompanyFixed && !selectedCompanyId) {
            setCompanyError('대상 회사를 선택해 주세요.');
            return;
        }
        onCommitAction({ file, companyId: targetCompanyId });
    };

    // isPreviewing 포함 — 이전 파일의 preview가 state에 남아있는 동안 제출 차단
    const canCommit =
        file !== null &&
        preview !== null &&
        previewError === null &&
        !isPreviewing &&
        !isCommitting &&
        (isCompanyFixed ? Boolean(defaultCompanyId) : selectedCompanyId.length > 0);

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="flex max-h-[90vh] max-w-3xl flex-col gap-0 p-0">
                <DialogHeader className="px-6 pt-6 pb-4">
                    <DialogTitle>{title}</DialogTitle>
                    <p className="text-muted-foreground text-sm">{description}</p>
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

                    {/* 도메인별 미리보기 테이블 */}
                    {preview && preview.length > 0 && (
                        <div className="mb-4">{renderPreviewAction(preview)}</div>
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
                                {companyError && <ErrorMessage>{companyError}</ErrorMessage>}
                            </>
                        )}
                    </div>
                </div>

                <DialogFooter className="mx-0 mb-0 rounded-b-xl px-6 py-4">
                    <Button variant="outline" onClick={() => handleOpenChange(false)}>
                        취소
                    </Button>
                    <Button disabled={!canCommit} onClick={handleCommit}>
                        {isCommitting ? '임포트 중…' : '임포트'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
