'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/hooks/queryKeys';
import { readApiError } from '@/lib/api-fetch-error';
import type { GhgEmissionRecord } from '@/types';
import { toast } from 'sonner';

const ERROR_FETCH = 'GHG 배출량 목록을 불러오지 못했습니다.';
const ERROR_UPDATE = 'GHG 배출량 수정에 실패했습니다.';
const ERROR_DELETE = 'GHG 배출량 삭제에 실패했습니다.';

async function fetchGhgEmissions(companyId: string): Promise<GhgEmissionRecord[]> {
    const res = await fetch(`/api/ghg-emissions?companyId=${encodeURIComponent(companyId)}`);
    if (!res.ok) throw new Error(await readApiError(res, ERROR_FETCH));
    return res.json() as Promise<GhgEmissionRecord[]>;
}

async function updateGhgEmission(
    id: string,
    payload: Omit<GhgEmissionRecord, 'id'>
): Promise<GhgEmissionRecord> {
    const res = await fetch(`/api/ghg-emissions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(await readApiError(res, ERROR_UPDATE));
    return res.json() as Promise<GhgEmissionRecord>;
}

async function deleteGhgEmission(id: string): Promise<void> {
    const res = await fetch(`/api/ghg-emissions/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(await readApiError(res, ERROR_DELETE));
}

export function useGhgEmissions(companyId: string) {
    return useQuery({
        queryKey: queryKeys.ghgEmissions.byCompany(companyId),
        queryFn: () => fetchGhgEmissions(companyId),
        enabled: companyId.length > 0,
    });
}

export function useUpdateGhgEmission(companyId: string, onSuccess?: () => void) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: Omit<GhgEmissionRecord, 'id'> }) =>
            updateGhgEmission(id, payload),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: queryKeys.ghgEmissions.byCompany(companyId),
            });
            // GHG 데이터는 companies LEFT JOIN에 포함되므로 companies도 무효화
            void queryClient.invalidateQueries({ queryKey: queryKeys.companies.all });
            toast.success('GHG 배출량이 수정되었습니다.');
            onSuccess?.();
        },
        onError: (error: Error) => toast.error(error.message),
    });
}

export function useDeleteGhgEmission(companyId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteGhgEmission,
        onMutate: async (id: string) => {
            await queryClient.cancelQueries({
                queryKey: queryKeys.ghgEmissions.byCompany(companyId),
            });
            const previous = queryClient.getQueryData<GhgEmissionRecord[]>(
                queryKeys.ghgEmissions.byCompany(companyId)
            );
            queryClient.setQueryData<GhgEmissionRecord[]>(
                queryKeys.ghgEmissions.byCompany(companyId),
                (old) => old?.filter((r) => r.id !== id)
            );
            return { previous };
        },
        onError: (_err: Error, _id, context) => {
            if (context?.previous) {
                queryClient.setQueryData(
                    queryKeys.ghgEmissions.byCompany(companyId),
                    context.previous
                );
            }
            toast.error(ERROR_DELETE);
        },
        onSettled: () => {
            void queryClient.invalidateQueries({
                queryKey: queryKeys.ghgEmissions.byCompany(companyId),
            });
            void queryClient.invalidateQueries({ queryKey: queryKeys.companies.all });
        },
    });
}
