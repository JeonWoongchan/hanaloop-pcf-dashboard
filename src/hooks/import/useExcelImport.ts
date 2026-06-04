'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/hooks/queryKeys';
import { readApiError } from '@/lib/api-fetch-error';
import { toast } from 'sonner';

type ImportPayload = { file: File; companyId: string };
type ImportResult = { inserted: number; companyId: string };

const IMPORT_ERROR_MESSAGE = '임포트에 실패했습니다.';

async function importExcel(payload: ImportPayload): Promise<ImportResult> {
    const formData = new FormData();
    formData.append('file', payload.file);
    formData.append('companyId', payload.companyId);

    const res = await fetch('/api/import', { method: 'POST', body: formData });
    if (!res.ok) {
        throw new Error(await readApiError(res, IMPORT_ERROR_MESSAGE));
    }
    return res.json() as Promise<ImportResult>;
}

export function useExcelImport(onSuccess?: () => void) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: importExcel,
        onSuccess: (data) => {
            void queryClient.invalidateQueries({ queryKey: queryKeys.companies.all });
            void queryClient.invalidateQueries({ queryKey: queryKeys.activityRecords.all });
            toast.success(`${data.inserted}건 임포트 완료`);
            onSuccess?.();
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });
}
