'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/hooks/queryKeys';
import { toast } from 'sonner';

type GhgImportPayload = { file: File; companyId: string };
type GhgImportResult = { upserted: number; companyId: string };

const IMPORT_ERROR_MESSAGE = 'GHG 배출량 임포트에 실패했습니다.';

async function importGhgEmissions(payload: GhgImportPayload): Promise<GhgImportResult> {
    const formData = new FormData();
    formData.append('file', payload.file);
    formData.append('companyId', payload.companyId);

    const res = await fetch('/api/ghg-emissions/import', { method: 'POST', body: formData });
    if (!res.ok) {
        const isJson = res.headers.get('content-type')?.includes('application/json');
        const body = isJson ? await res.json().catch((): unknown => null) : null;
        const message =
            typeof body === 'object' && body !== null && 'error' in body
                ? String(body.error)
                : IMPORT_ERROR_MESSAGE;
        throw new Error(message);
    }
    return res.json() as Promise<GhgImportResult>;
}

export function useGhgImport(onSuccess?: () => void) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: importGhgEmissions,
        onSuccess: (data) => {
            // GHG 배출량은 companies API에 LEFT JOIN으로 포함되므로 companies 캐시 무효화
            void queryClient.invalidateQueries({ queryKey: queryKeys.companies.all });
            toast.success(`${data.upserted}건 GHG 배출량 임포트 완료`);
            onSuccess?.();
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });
}
