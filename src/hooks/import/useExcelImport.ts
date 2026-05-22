'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/hooks/queryKeys';
import { toast } from 'sonner';

type ImportPayloadExisting = { mode: 'existing'; file: File; companyId: string };
type ImportPayloadNew = { mode: 'new'; file: File; companyName: string; companyCountry: string };
type ImportPayload = ImportPayloadExisting | ImportPayloadNew;

type ImportResult = { inserted: number; companyId: string };

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
        // HTML 오류 페이지(413, 504 등) 수신 시 JSON 파싱 오류 방지
        const isJson = res.headers.get('content-type')?.includes('application/json');
        const body = isJson ? ((await res.json()) as { error?: string }) : {};
        throw new Error(body.error ?? '임포트에 실패했습니다.');
    }
    return res.json() as Promise<ImportResult>;
}

export function useExcelImport(onSuccess?: () => void) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: importExcel,
        onSuccess: (data) => {
            void queryClient.invalidateQueries({ queryKey: queryKeys.companies.all });
            toast.success(`${data.inserted}건 임포트 완료`);
            onSuccess?.();
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });
}
