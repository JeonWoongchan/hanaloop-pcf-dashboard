import { useQuery } from '@tanstack/react-query';
import { fetchCountries } from '@/lib/api';
import { queryKeys } from './queryKeys';
import { STALE_TIME } from '@/constants/cache';

export function useCountries() {
    return useQuery({
        queryKey: queryKeys.countries.all,
        queryFn: fetchCountries,
        // 국가 목록은 자주 바뀌지 않으므로 긴 staleTime 적용
        staleTime: STALE_TIME.LONG,
    });
}
