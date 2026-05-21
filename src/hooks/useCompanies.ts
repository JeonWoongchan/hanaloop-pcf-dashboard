import { useQuery } from '@tanstack/react-query';
import { fetchCompanies } from '@/lib/api';
import { queryKeys } from './queryKeys';
import { STALE_TIME } from '@/constants/cache';

export function useCompanies() {
    return useQuery({
        queryKey: queryKeys.companies.all,
        queryFn: fetchCompanies,
        staleTime: STALE_TIME.LONG,
    });
}

// 전체 목록을 캐시에서 파생 — 개별 fetch 없이 재사용
export function useCompany(id: string) {
    const { data: companies, ...rest } = useCompanies();
    return {
        data: companies?.find((c) => c.id === id),
        ...rest,
    };
}
