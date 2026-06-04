'use client';

import * as React from 'react';
import { Download } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { getErrorMessage } from '@/lib/errors';
import { downloadReportWorkbook } from '@/lib/reports/excel';
import type { ReportWorkbook } from '@/lib/reports/types';

export type ReportExportButtonProps = Omit<
    React.ComponentProps<typeof Button>,
    'children' | 'onClick'
> & {
    buildReportAction: () => ReportWorkbook | Promise<ReportWorkbook>;
    fileName?: string;
    label?: string;
    pendingLabel?: string;
    successMessage?: string;
    errorMessage?: string;
};

export function ReportExportButton({
    buildReportAction,
    fileName,
    label = '보고서 내보내기',
    pendingLabel = '내보내는 중',
    successMessage = '엑셀 보고서를 내보냈습니다.',
    errorMessage = '보고서 내보내기에 실패했습니다.',
    disabled,
    variant = 'outline',
    size = 'sm',
    ...props
}: ReportExportButtonProps) {
    const [isPending, setIsPending] = React.useState(false);

    const handleClick = async () => {
        setIsPending(true);

        try {
            const reportWorkbook = await buildReportAction();
            await downloadReportWorkbook(reportWorkbook, { fileName });
            toast.success(successMessage);
        } catch (error) {
            toast.error(getErrorMessage(error, errorMessage));
        } finally {
            setIsPending(false);
        }
    };

    return (
        <Button
            type="button"
            variant={variant}
            size={size}
            disabled={disabled || isPending}
            onClick={handleClick}
            {...props}
        >
            <Download
                data-icon="inline-start"
                className={isPending ? 'animate-pulse' : undefined}
            />
            {isPending ? pendingLabel : label}
        </Button>
    );
}
