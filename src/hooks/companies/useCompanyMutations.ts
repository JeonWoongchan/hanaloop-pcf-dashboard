'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/hooks/queryKeys';
import type { Company } from '@/types';
import { toast } from 'sonner';

type CompanyPayload = { name: string; countryCode: string };

async function createCompany(payload: CompanyPayload): Promise<Company> {
    const res = await fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const body = await res.json().catch((): unknown => null);
        const message =
            typeof body === 'object' && body !== null && 'error' in body
                ? String(body.error)
                : '회사 등록에 실패했습니다.';
        throw new Error(message);
    }
    return res.json() as Promise<Company>;
}

async function updateCompany(id: string, payload: CompanyPayload): Promise<Company> {
    const res = await fetch(`/api/companies/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const body = await res.json().catch((): unknown => null);
        const message =
            typeof body === 'object' && body !== null && 'error' in body
                ? String(body.error)
                : '회사 수정에 실패했습니다.';
        throw new Error(message);
    }
    return res.json() as Promise<Company>;
}

async function deleteCompany(id: string): Promise<void> {
    const res = await fetch(`/api/companies/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('회사 삭제에 실패했습니다.');
}

export function useCreateCompany(onSuccess?: () => void) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createCompany,
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: queryKeys.companies.all });
            toast.success('회사가 등록되었습니다.');
            onSuccess?.();
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });
}

export function useUpdateCompany(onSuccess?: () => void) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: CompanyPayload }) =>
            updateCompany(id, payload),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: queryKeys.companies.all });
            toast.success('회사 정보가 수정되었습니다.');
            onSuccess?.();
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });
}

export function useDeleteCompany() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteCompany,
        onMutate: async (id: string) => {
            // 진행 중인 refetch를 취소해 낙관적 업데이트가 덮어쓰이지 않도록 방지
            await queryClient.cancelQueries({ queryKey: queryKeys.companies.all });
            const previous = queryClient.getQueryData<Company[]>(queryKeys.companies.all);
            queryClient.setQueryData<Company[]>(queryKeys.companies.all, (old) =>
                old?.filter((c) => c.id !== id)
            );
            return { previous };
        },
        onError: (_error: Error, _id, context) => {
            if (context?.previous) {
                queryClient.setQueryData(queryKeys.companies.all, context.previous);
            }
            toast.error('회사 삭제에 실패했습니다.');
        },
        onSettled: () => {
            void queryClient.invalidateQueries({ queryKey: queryKeys.companies.all });
        },
    });
}
