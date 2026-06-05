'use client';

import * as React from 'react';
import { FileText } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { getErrorMessage } from '@/lib/errors';
import { writeReportLoadingPreview, writeReportPrintPreview } from '@/lib/reports/print-preview';
import type { ReportWorkbook } from '@/lib/reports/types';

export type ReportExportButtonProps = Omit<
    React.ComponentProps<typeof Button>,
    'children' | 'onClick'
> & {
    buildReportAction: () => ReportWorkbook | Promise<ReportWorkbook>;
    label?: string;
    pendingLabel?: string;
    errorMessage?: string;
};

export function ReportExportButton({
    buildReportAction,
    label = '보고서 출력',
    pendingLabel = '미리보기 준비 중',
    errorMessage = '보고서 미리보기에 실패했습니다.',
    disabled,
    variant = 'outline',
    size = 'sm',
    className,
    ...props
}: ReportExportButtonProps) {
    const [isPending, setIsPending] = React.useState(false);
    // ref로 동기 가드 — 리렌더 전 두 번째 클릭 차단
    const isPendingRef = React.useRef(false);

    const handlePrintPreview = async () => {
        if (isPendingRef.current) return;
        isPendingRef.current = true;
        setIsPending(true);

        const previewWindow = window.open('', '_blank');

        try {
            if (!previewWindow) {
                throw new Error(
                    '보고서 미리보기 창을 열 수 없습니다. 팝업 차단 설정을 확인하세요.'
                );
            }

            writeReportLoadingPreview(previewWindow);
            const reportWorkbook = await buildReportAction();
            writeReportPrintPreview(previewWindow, reportWorkbook);
        } catch (error) {
            previewWindow?.close();
            toast.error(getErrorMessage(error, errorMessage));
        } finally {
            isPendingRef.current = false;
            setIsPending(false);
        }
    };

    return (
        <div
            className={
                className
                    ? `flex flex-wrap items-center gap-2 ${className}`
                    : 'flex flex-wrap items-center gap-2'
            }
        >
            <Button
                type="button"
                variant={variant}
                size={size}
                disabled={disabled || isPending}
                onClick={handlePrintPreview}
                {...props}
            >
                <FileText
                    data-icon="inline-start"
                    className={isPending ? 'animate-pulse' : undefined}
                />
                {isPending ? pendingLabel : label}
            </Button>
        </div>
    );
}
