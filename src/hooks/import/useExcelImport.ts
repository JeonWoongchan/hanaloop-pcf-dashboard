'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/hooks/queryKeys';
import { toast } from 'sonner';

type ImportPayloadExisting = { mode: 'existing'; file: File; companyId: string };
type ImportPayloadNew = { mode: 'new'; file: File; companyName: string; companyCountry: string };
type ImportPayload = ImportPayloadExisting | ImportPayloadNew;

type ImportResult = { inserted: number; companyId: string };

const IMPORT_ERROR_MESSAGE = '임포트에 실패했습니다.';

function getApiErrorMessage(body: unknown): string | null {
    if (typeof body !== 'object' || body === null || !('error' in body)) {
        return null;
    }

    const error = body.error;
    return typeof error === 'string' && error.trim() ? error : null;
}

async function readImportError(response: Response): Promise<string> {
    const isJson = response.headers.get('content-type')?.includes('application/json');
    if (!isJson) {
        return IMPORT_ERROR_MESSAGE;
    }

    const body = await response.json().catch((): unknown => null);
    return getApiErrorMessage(body) ?? IMPORT_ERROR_MESSAGE;
}

async function importExcel(payload: ImportPayload): Promise<ImportResult> {
    const formData = new FormData();
    formData.append('file', payload.file);

    if (payload.mode === 'existing') {
        formData.append('companyId', payload.companyId);
    } else {
        formData.append('newCompanyName', payload.companyName);
        formData.append('newCompanyCountry', payload.companyCountry);
    }

    const res = await fetch('/api/import', { method: 'POST', body: formData });
    if (!res.ok) {
        // HTML 오류 페이지(413, 504 등) 수신 시 JSON 파싱 오류를 피한다.
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
