'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/hooks/queryKeys';
import { toast } from 'sonner';

type ImportPayload = { file: File; companyId: string };
type ImportResult = { inserted: number; companyId: string };

const IMPORT_ERROR_MESSAGE = '임포트에 실패했습니다.';

function getApiErrorMessage(body: unknown): string | null {
    if (typeof body !== 'object' || body === null || !('error' in body)) return null;
    const error = body.error;
    return typeof error === 'string' && error.trim() ? error : null;
}

async function readImportError(response: Response): Promise<string> {
    const isJson = response.headers.get('content-type')?.includes('application/json');
    if (!isJson) return IMPORT_ERROR_MESSAGE;
    const body = await response.json().catch((): unknown => null);
    return getApiErrorMessage(body) ?? IMPORT_ERROR_MESSAGE;
}

async function importExcel(payload: ImportPayload): Promise<ImportResult> {
    const formData = new FormData();
    formData.append('file', payload.file);
    formData.append('companyId', payload.companyId);

    const res = await fetch('/api/import', { method: 'POST', body: formData });
    if (!res.ok) {
        throw new Error(await readImportError(res));
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
