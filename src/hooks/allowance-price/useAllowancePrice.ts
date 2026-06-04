'use client';

import { useQuery } from '@tanstack/react-query';
import { STALE_TIME } from '@/constants/cache';
import { queryKeys } from '@/hooks/queryKeys';
import { readApiError } from '@/lib/api-fetch-error';
import type { AllowancePrice } from '@/types';

async function fetchCurrentAllowancePrice(): Promise<AllowancePrice> {
    const res = await fetch('/api/allowance-prices/current');
    if (!res.ok) throw new Error(await readApiError(res, '배출권 단가를 불러오지 못했습니다.'));
    return res.json() as Promise<AllowancePrice>;
}

export function useAllowancePrice() {
    return useQuery({
        queryKey: queryKeys.allowancePrice.current,
        queryFn: fetchCurrentAllowancePrice,
        staleTime: STALE_TIME.LONG,
    });
}
