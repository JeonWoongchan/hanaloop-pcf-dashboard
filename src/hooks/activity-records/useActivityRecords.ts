'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { STALE_TIME } from '@/constants/cache';
import { queryKeys } from '@/hooks/queryKeys';
import { readApiError } from '@/lib/api-fetch-error';
import type { ActivityRecord } from '@/types';
import { toast } from 'sonner';

const FETCH_ERROR = '활동 데이터를 불러오지 못했습니다.';
const DELETE_ERROR = '활동 데이터 삭제에 실패했습니다.';

async function fetchActivityRecords(endpoint: string): Promise<ActivityRecord[]> {
    const res = await fetch(endpoint);
    if (!res.ok) throw new Error(await readApiError(res, FETCH_ERROR));
    return res.json() as Promise<ActivityRecord[]>;
}

async function deleteActivityRecord(id: string): Promise<void> {
    const res = await fetch(`/api/activity-records/record/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(await readApiError(res, DELETE_ERROR));
}

export function useAllActivityRecords() {
    return useQuery({
        queryKey: queryKeys.activityRecords.all,
        queryFn: () => fetchActivityRecords('/api/activity-records'),
        staleTime: STALE_TIME.LONG,
    });
}

export function useActivityRecords(companyId: string) {
    const normalizedId = companyId.trim();

    return useQuery({
        queryKey: queryKeys.activityRecords.byCompany(normalizedId),
        queryFn: () =>
            fetchActivityRecords(
                `/api/activity-records/${encodeURIComponent(normalizedId)}`
            ),
        enabled: normalizedId.length > 0,
        staleTime: STALE_TIME.LONG,
    });
}

export function useDeleteActivityRecord(companyId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteActivityRecord,
        onMutate: async (id: string) => {
            await queryClient.cancelQueries({
                queryKey: queryKeys.activityRecords.byCompany(companyId),
            });
            const previous = queryClient.getQueryData<ActivityRecord[]>(
                queryKeys.activityRecords.byCompany(companyId)
            );
            queryClient.setQueryData<ActivityRecord[]>(
                queryKeys.activityRecords.byCompany(companyId),
                (old) => old?.filter((r) => r.id !== id)
            );
            return { previous };
        },
        onError: (_err: Error, _id, context) => {
            if (context?.previous) {
                queryClient.setQueryData(
                    queryKeys.activityRecords.byCompany(companyId),
                    context.previous
                );
            }
            toast.error(DELETE_ERROR);
        },
        onSettled: () => {
            void queryClient.invalidateQueries({
                queryKey: queryKeys.activityRecords.byCompany(companyId),
            });
        },
    });
}
