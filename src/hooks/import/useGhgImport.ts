'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/hooks/queryKeys';
import { readApiError } from '@/lib/api-fetch-error';
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
        throw new Error(await readApiError(res, IMPORT_ERROR_MESSAGE));
    }
    return res.json() as Promise<GhgImportResult>;
}

export function useGhgImport(onSuccess?: () => void) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: importGhgEmissions,
        onSuccess: (data) => {
            // 상세 페이지는 원본 GHG 테이블과 companies LEFT JOIN 집계를 함께 사용한다.
            void queryClient.invalidateQueries({
                queryKey: queryKeys.ghgEmissions.byCompany(data.companyId),
            });
            void queryClient.invalidateQueries({ queryKey: queryKeys.companies.all });
            toast.success(`${data.upserted}건 GHG 배출량 임포트 완료`);
            onSuccess?.();
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });
}
