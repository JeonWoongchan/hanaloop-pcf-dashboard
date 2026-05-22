'use client';

import { STALE_TIME } from '@/constants/cache';
import { queryKeys } from '@/hooks/queryKeys';
import type { ActivityRecord } from '@/types';
import { useQuery } from '@tanstack/react-query';

const ACTIVITY_RECORDS_ERROR_MESSAGE = '활동 데이터를 불러오지 못했습니다.';
const ACTIVITY_RECORDS_STALE_TIME = STALE_TIME.LONG;

function getApiErrorMessage(body: unknown): string | null {
    if (typeof body !== 'object' || body === null || !('error' in body)) {
        return null;
    }

    const error = body.error;
    return typeof error === 'string' && error.trim() ? error : null;
}

async function readApiError(response: Response): Promise<string> {
    const body = await response.json().catch((): unknown => null);
    return getApiErrorMessage(body) ?? ACTIVITY_RECORDS_ERROR_MESSAGE;
}

async function fetchActivityRecords(endpoint: string): Promise<ActivityRecord[]> {
    const res = await fetch(endpoint);
    if (!res.ok) {
        throw new Error(await readApiError(res));
    }

    return res.json() as Promise<ActivityRecord[]>;
}

function activityRecordsByCompanyEndpoint(companyId: string): string {
    return `/api/activity-records/${encodeURIComponent(companyId)}`;
}

function fetchAllActivityRecords(): Promise<ActivityRecord[]> {
    return fetchActivityRecords('/api/activity-records');
}

function fetchActivityRecordsByCompany(companyId: string): Promise<ActivityRecord[]> {
    if (!companyId) {
        return Promise.resolve([]);
    }

    return fetchActivityRecords(activityRecordsByCompanyEndpoint(companyId));
}

export function useAllActivityRecords() {
    return useQuery({
        queryKey: queryKeys.activityRecords.all,
        queryFn: fetchAllActivityRecords,
        staleTime: ACTIVITY_RECORDS_STALE_TIME,
    });
}

export function useActivityRecords(companyId: string) {
    const normalizedCompanyId = companyId.trim();

    return useQuery({
        queryKey: queryKeys.activityRecords.byCompany(normalizedCompanyId),
        queryFn: () => fetchActivityRecordsByCompany(normalizedCompanyId),
        enabled: normalizedCompanyId.length > 0,
        staleTime: ACTIVITY_RECORDS_STALE_TIME,
    });
}
