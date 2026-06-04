'use client';

import { useQuery } from '@tanstack/react-query';
import { STALE_TIME } from '@/constants/cache';
import { queryKeys } from '@/hooks/queryKeys';
import { readApiError } from '@/lib/api-fetch-error';
import type { AllowancePrice } from '@/types';

async function fetchAllowancePrice(year?: number): Promise<AllowancePrice> {
    const url = year
        ? `/api/allowance-prices/current?year=${year}`
        : '/api/allowance-prices/current';
    const res = await fetch(url);
    if (!res.ok) throw new Error(await readApiError(res, '배출권 단가를 불러오지 못했습니다.'));
    return res.json() as Promise<AllowancePrice>;
}

// year를 전달하면 해당 연도 말일 기준 단가, 없으면 전체 최신 단가
export function useAllowancePrice(year?: number) {
    return useQuery({
        queryKey: year ? queryKeys.allowancePrice.byYear(year) : queryKeys.allowancePrice.latest,
        queryFn: () => fetchAllowancePrice(year),
        staleTime: STALE_TIME.LONG,
    });
}
